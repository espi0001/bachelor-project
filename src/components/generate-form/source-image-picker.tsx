'use client';
/**
 * The "Choose source image" view in the generate dialog: picks which of the product's Shopify images, or which image
 * uploaded from the user's device, a type is generated from.
 */

import Image from "next/image";
import { useId, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { createSourceImageUpload } from "@/app/products/[id]/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { DialogStep } from "@/components/generate-form/dialog-step";
import type { ProductImage } from "@/lib/shopify/products";
import {
  isSourceImageContentType,
  SOURCE_IMAGE_EXTENSIONS,
  SOURCE_IMAGE_MAX_BYTES,
  SOURCE_IMAGE_MIN_PIXELS,
} from "@/lib/source-image";

/** What the file row shows about a file from the device. */
type FileInfo = {
  name: string;
  /** A blob: link to the file on the device. Null if the file could not be read as an image. */
  previewUrl: string | null;
  /** Pixels. Null if the file could not be read as an image. */
  width: number | null;
  height: number | null;
};

/**
 * A type's source as the dialog keeps it. An upload also keeps its local preview and file details, so it shows
 * without a round trip, and the file row looks the same when the picker is opened again.
 */
export type PickedSource =
  | { kind: "shopify"; imageId: string }
  | { kind: "upload"; path: string; previewUrl: string; file: FileInfo };

/** The state of the file in the "From device" tab. */
type Upload =
  | { status: "empty" }
  | { status: "uploading"; file: FileInfo }
  | { status: "done"; file: FileInfo & { previewUrl: string }; path: string }
  /** `reason` is the short text in the badge, `message` the full explanation under the row. */
  | { status: "error"; file: FileInfo; reason: string; message: string };

type FileCheck =
  | { ok: true; width: number; height: number }
  | { ok: false; reason: string; message: string; width: number | null; height: number | null };

const TABS = [
  { id: "shopify", label: "From the Shopify product" },
  { id: "upload", label: "From device" },
] as const;
type Tab = (typeof TABS)[number]["id"];

/** For the file dialog. Listing only these makes iOS convert HEIC camera photos to JPEG. */
const ACCEPT = Object.keys(SOURCE_IMAGE_EXTENSIONS).join(",");

export function SourceImagePicker({
  productUrlId,
  typeLabel,
  images,
  current,
  onUse,
  onBack,
}: {
  productUrlId: string;
  /** The image type the source is for, e.g. "Packshot". */
  typeLabel: string;
  images: ProductImage[];
  /** The type's source when the picker opens. Null if it has none yet (a product without Shopify images). */
  current: PickedSource | null;
  /** Called with the chosen source when the user clicks "Use this image". */
  onUse: (source: PickedSource) => void;
  /** Called when the user goes back without saving the choice. */
  onBack: () => void;
}) {
  // Only pending choices: they are saved when the user clicks "Use this image", and dropped on Back or Close.
  // An upload dropped this way stays in Storage without a row (known gap, BA-150).
  const [pendingId, setPendingId] = useState(
    current?.kind === "shopify" ? current.imageId : (images[0]?.id ?? ""),
  );
  const [upload, setUpload] = useState<Upload>(
    current?.kind === "upload"
      ? { status: "done", file: { ...current.file, previewUrl: current.previewUrl }, path: current.path }
      : { status: "empty" },
  );
  // Opens where the current source is. Without Shopify images, upload is the only way to get one.
  const [activeTab, setActiveTab] = useState<Tab>(
    current?.kind === "upload" || images.length === 0 ? "upload" : "shopify",
  );
  const [isDragging, setIsDragging] = useState(false);
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chooseFileRef = useRef<HTMLButtonElement>(null);
  // Counts files picked, so a slow upload that finishes after a newer file was picked is ignored.
  const uploadCount = useRef(0);
  const baseId = useId();
  const radioName = `${baseId}-source`;
  const footerNoteId = `${baseId}-footer-note`;
  const uploadErrorId = `${baseId}-upload-error`;
  const isUploadTab = activeTab === "upload";

  // The source "Use this image" would save, or null if there is none yet.
  const choice: PickedSource | null = isUploadTab
    ? upload.status === "done"
      ? { kind: "upload", path: upload.path, previewUrl: upload.file.previewUrl, file: upload.file }
      : null
    : pendingId
      ? { kind: "shopify", imageId: pendingId }
      : null;
  // Left in the footer, as in the design. When the button is disabled, it also says why, so the button points to it.
  const footerNote = isUploadTab
    ? upload.status === "done"
      ? "1 image uploaded"
      : upload.status === "uploading"
        ? "Uploading …"
        : "Upload an image first."
    : choice
      ? null
      : "This product has no images in Shopify.";

  /** Arrow keys, Home and End move between tabs, as in the WAI-ARIA tabs pattern. Only the active tab is a tab stop. */
  function handleTabKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = TABS.length - 1;
    const next =
      e.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : e.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    setActiveTab(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus();
  }

  /** Checks the file in the browser, then uploads it straight to Storage, so errors show now and not at Generate. */
  async function handleFile(file: File) {
    const attempt = ++uploadCount.current;
    const isCurrent = () => attempt === uploadCount.current;

    const check = await checkFile(file);
    if (!isCurrent()) return;
    // A blob: link to the file on the device, only when it is an image. Not revoked: the dialog may keep showing
    // it until the page closes.
    const previewUrl = check.width !== null ? URL.createObjectURL(file) : null;
    const info = { name: file.name, previewUrl, width: check.width, height: check.height };
    if (!check.ok) {
      setUpload({ status: "error", file: info, reason: check.reason, message: check.message });
      return;
    }
    const doneInfo = { ...info, previewUrl: previewUrl ?? URL.createObjectURL(file) };
    setUpload({ status: "uploading", file: doneInfo });

    const failed = (message: string) =>
      setUpload({ status: "error", file: doneInfo, reason: "Upload failed", message });
    try {
      const result = await createSourceImageUpload(productUrlId, file.type, file.size);
      if (!isCurrent()) return;
      if (!result.ok) {
        failed(result.error);
        return;
      }
      // Straight to Storage with the signed link, so the file does not pass through our server and its size limit.
      const res = await fetch(result.uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type, "x-upsert": "false" },
        body: file,
      });
      if (!isCurrent()) return;
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      setUpload({ status: "done", file: doneInfo, path: result.path });
    } catch {
      if (isCurrent()) failed("The image could not be uploaded. Try again.");
    }
  }

  /** Clears the file row. The file stays in Storage (known gap, BA-150). Focus goes to Choose file, since Remove is gone. */
  function removeUpload() {
    uploadCount.current++; // An upload still running is ignored when it finishes.
    setUpload({ status: "empty" });
    chooseFileRef.current?.focus();
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  return (
    <DialogStep
      top={
        <>
          <p className="typography-label text-primary">For: {typeLabel}</p>
          <p className="mb-4 typography-body-sm text-secondary">
            The generated image is made from the image you choose here.
          </p>

          <div
            role="tablist"
            aria-label="Where the source image comes from"
            className="grid grid-cols-2 gap-1 rounded-lg bg-subtle p-1"
          >
            {TABS.map((tab, i) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  ref={(button) => {
                    tabRefs.current[tab.id] = button;
                  }}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`${baseId}-panel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, i)}
                  className={`rounded-md px-3 py-2 typography-label focus-ring ${
                    isActive ? "bg-surface text-primary shadow-sm" : "text-secondary hover:text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </>
      }
      bottom={
        // Only on the Shopify tab, as in the design.
        !isUploadTab && (
          <p className="rounded-lg bg-subtle p-4 typography-body-sm text-secondary">
            Tip: use a clear photo that shows only the product. The source is shown next to the generated image when you
            approve it.
          </p>
        )
      }
      footer={
        <div className="flex flex-wrap items-center justify-end gap-3">
          {footerNote && (
            <p id={footerNoteId} className="mr-auto typography-body-sm text-secondary">
              {footerNote}
            </p>
          )}
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={() => choice && onUse(choice)}
            disabled={!choice}
            aria-describedby={choice ? undefined : footerNoteId}
          >
            Use this image
          </Button>
        </div>
      }
    >
      <div
        role="tabpanel"
        id={`${baseId}-panel-shopify`}
        aria-labelledby={`${baseId}-tab-shopify`}
        hidden={activeTab !== "shopify"}
      >
        {images.length === 0 ? (
          <p className="typography-body text-secondary">
            This product has no images in Shopify. Upload one from your device instead.
          </p>
        ) : (
          // Native radios, so arrow keys move between the images and screen readers say "1 of 4, selected".
          <fieldset>
            <legend className="sr-only">Source image</legend>
            {/* p-1 leaves room for the focus outline, which overflow-x-auto would otherwise cut off. */}
            <ul className="flex gap-4 overflow-x-auto p-1 pb-2">
              {images.map((image, i) => {
                const isSelected = image.id === pendingId;
                return (
                  <li key={image.id} className="w-32 shrink-0 sm:w-36">
                    <label className="block cursor-pointer">
                      <input
                        type="radio"
                        name={radioName}
                        value={image.id}
                        checked={isSelected}
                        onChange={() => setPendingId(image.id)}
                        className="peer sr-only"
                      />
                      {/* The alt text is the radio's name. Shopify's alt text is often empty, so fall back to the position. */}
                      <Image
                        src={image.url}
                        alt={image.altText || `Product image ${i + 1}`}
                        width={144}
                        height={144}
                        className="aspect-square w-full rounded-lg border-2 border-transparent bg-subtle object-contain peer-checked:border-instant-blue peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-instant-blue dark:peer-checked:border-blue-400 dark:peer-focus-visible:outline-blue-400"
                      />
                    </label>
                    {/* Hidden from screen readers: the radio already says it is selected. */}
                    {isSelected && (
                      <p aria-hidden="true" className="mt-2 flex items-center gap-1 typography-label text-brand">
                        <Icon name="checkbox-check" size="xs" />
                        Selected
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </fieldset>
        )}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-upload`}
        aria-labelledby={`${baseId}-tab-upload`}
        hidden={!isUploadTab}
      >
        {/* Dropping is a shortcut for the mouse; Choose file does the same with the keyboard or on a phone. */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-6 py-8 text-center ${
            isDragging ? "border-instant-blue bg-surface dark:border-blue-400" : "border-default bg-subtle"
          }`}
        >
          <Icon name="upload" className="text-primary" />
          <p className="typography-body text-secondary">Drag an image here, or</p>
          <Button
            ref={chooseFileRef}
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={upload.status === "uploading"}
          >
            Choose file
          </Button>
          {/* Hidden: the button above opens it. On a phone, the file dialog also offers to take a photo. */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            hidden
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              // Cleared, so choosing the same file again still fires onChange.
              e.currentTarget.value = "";
              if (file) void handleFile(file);
            }}
          />
          <p className="typography-body-sm text-secondary">
            JPG, PNG or WebP · min. {SOURCE_IMAGE_MIN_PIXELS} × {SOURCE_IMAGE_MIN_PIXELS} px · max.{" "}
            {SOURCE_IMAGE_MAX_BYTES / 1024 / 1024} MB
          </p>
        </div>

        {upload.status !== "empty" && (
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-default p-3">
              {/* unoptimized: a blob: link only exists in this browser, so the image optimizer cannot fetch it. */}
              {upload.file.previewUrl ? (
                <Image
                  src={upload.file.previewUrl}
                  alt=""
                  width={56}
                  height={56}
                  unoptimized
                  className="size-14 shrink-0 rounded-md bg-subtle object-contain"
                />
              ) : (
                <div aria-hidden="true" className="size-14 shrink-0 rounded-md bg-subtle" />
              )}
              {/* min-w-0 lets a long file name be cut off with "…" instead of pushing the row wider. */}
              <div className="min-w-0 flex-1 basis-32">
                <p className="truncate typography-label text-primary" title={upload.file.name}>
                  {upload.file.name}
                </p>
                {upload.file.width !== null && (
                  <p className="typography-body-sm text-secondary">
                    {upload.file.width} × {upload.file.height} px
                  </p>
                )}
              </div>
              {/* Announced when the upload finishes or fails. */}
              <span aria-live="polite">
                {upload.status === "uploading" ? (
                  <Badge variant="warning">Uploading …</Badge>
                ) : upload.status === "done" ? (
                  <Badge variant="success">Meets requirements</Badge>
                ) : (
                  <Badge variant="error">{upload.reason}</Badge>
                )}
              </span>
              {/* A text button in the brand colour, like a link, as in the design. */}
              <button
                type="button"
                onClick={removeUpload}
                aria-describedby={upload.status === "error" ? uploadErrorId : undefined}
                className="rounded-sm typography-label text-brand focus-ring hover:underline dark:text-blue-400"
              >
                Remove<span className="sr-only"> {upload.file.name}</span>
              </button>
            </div>
            {upload.status === "error" && (
              <p id={uploadErrorId} role="alert" className="mt-2 typography-body-sm text-error">
                {upload.message}
              </p>
            )}
          </div>
        )}
      </div>
    </DialogStep>
  );
}

/** Checks the file against the requirements in the upload panel, and reads its size in pixels when it is an image. */
async function checkFile(file: File): Promise<FileCheck> {
  if (!isSourceImageContentType(file.type)) {
    return {
      ok: false,
      reason: "Wrong file type",
      message: "Choose a JPG, PNG or WebP image.",
      width: null,
      height: null,
    };
  }

  // Decoding also catches a file that is named like an image but is not one.
  let width: number;
  let height: number;
  try {
    const bitmap = await createImageBitmap(file);
    ({ width, height } = bitmap);
    bitmap.close();
  } catch {
    return {
      ok: false,
      reason: "Not an image",
      message: "This file could not be read as an image.",
      width: null,
      height: null,
    };
  }

  const maxMegabytes = SOURCE_IMAGE_MAX_BYTES / 1024 / 1024;
  if (file.size > SOURCE_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      reason: "Too large",
      message: `The image must be ${maxMegabytes} MB or smaller.`,
      width,
      height,
    };
  }
  if (width < SOURCE_IMAGE_MIN_PIXELS || height < SOURCE_IMAGE_MIN_PIXELS) {
    return {
      ok: false,
      reason: "Too small",
      message: `The image must be at least ${SOURCE_IMAGE_MIN_PIXELS} × ${SOURCE_IMAGE_MIN_PIXELS} px. This one is ${width} × ${height} px.`,
      width,
      height,
    };
  }
  return { ok: true, width, height };
}
