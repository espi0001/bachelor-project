'use client';
/**
 * The "Choose source image" view in the generate dialog: picks which of the product's images a type is generated from.
 */

import Image from "next/image";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { DialogStep } from "@/components/generate-form/dialog-step";
import type { ProductImage } from "@/lib/shopify/products";

// Upload is only shown for now: its panel is there, but nothing in it works yet.
const TABS = [
  { id: "shopify", label: "From the Shopify product" },
  { id: "upload", label: "Upload from computer" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export function SourceImagePicker({
  typeLabel,
  images,
  currentImageId,
  onUse,
  onBack,
}: {
  /** The image type the source is for, e.g. "Packshot". */
  typeLabel: string;
  images: ProductImage[];
  /** Selected when the picker opens. */
  currentImageId: string;
  /** Called with the chosen image ID when the user clicks "Use this image". */
  onUse: (imageId: string) => void;
  /** Called when the user goes back without saving the choice. */
  onBack: () => void;
}) {
  // Only a pending choice: it is saved when the user clicks "Use this image", and dropped on Back or Close.
  const [pendingId, setPendingId] = useState(currentImageId);
  const [activeTab, setActiveTab] = useState<Tab>("shopify");
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const baseId = useId();
  const radioName = `${baseId}-source`;
  const uploadUnavailableId = `${baseId}-upload-unavailable`;
  const isUploadTab = activeTab === "upload";

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
        <div className="flex items-center justify-end gap-3">
          {/* Only for screen readers: why the upload buttons are disabled. The design shows no note. */}
          <p id={uploadUnavailableId} className="sr-only">
            Uploading from your computer is not available yet.
          </p>
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={() => onUse(pendingId)}
            disabled={isUploadTab}
            aria-describedby={isUploadTab ? uploadUnavailableId : undefined}
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
        {/* Native radios, so arrow keys move between the images and screen readers say "1 of 4, selected". */}
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
      </div>

      {/* tabIndex 0: the panel has nothing else that can take focus, since Choose file is disabled. */}
      <div
        role="tabpanel"
        id={`${baseId}-panel-upload`}
        aria-labelledby={`${baseId}-tab-upload`}
        hidden={!isUploadTab}
        tabIndex={0}
        className="focus-ring rounded-lg"
      >
        <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-default bg-subtle px-6 py-10 text-center">
          <Icon name="upload" className="text-primary" />
          <p className="typography-body text-secondary">Drag an image here, or</p>
          <Button variant="secondary" disabled aria-describedby={uploadUnavailableId}>
            Choose file
          </Button>
          <p className="typography-body-sm text-secondary">JPG, PNG or WebP · min. 500 × 500 px · max. 20 MB</p>
        </div>
      </div>
    </DialogStep>
  );
}
