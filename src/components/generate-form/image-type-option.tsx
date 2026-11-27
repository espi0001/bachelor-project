'use client';
/**
 * One image type in the generate dialog: a checkbox, and when it is checked, the source image it will be generated from.
 */

import Image from "next/image";
import { useId, type Ref } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { ProductImage } from "@/lib/shopify/products";

export function ImageTypeOption({
  label,
  checked,
  onCheckedChange,
  source,
  onChangeSource,
  changeButtonRef,
}: {
  /** Shown next to the checkbox, e.g. "Packshot". */
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** The image this type is generated from. */
  source: ProductImage;
  /** Called when the user clicks Change to pick another source. */
  onChangeSource: () => void;
  /** Lets the dialog move focus back to Change when the user leaves the source picker. */
  changeButtonRef?: Ref<HTMLButtonElement>;
}) {
  const labelId = useId();

  return (
    <div>
      <label className="flex cursor-pointer items-center gap-3 py-1 typography-body text-primary">
        <span className="relative flex size-5 shrink-0">
          {/* A real checkbox, styled to match Figma, so keyboard and screen readers work as usual.
              The border is darker than border-default, because a control's edge needs 3:1 contrast (WCAG 1.4.11). */}
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckedChange(e.currentTarget.checked)}
            className="peer size-5 cursor-pointer appearance-none rounded border border-zinc-500 bg-surface focus-ring checked:border-transparent checked:bg-brand dark:border-zinc-400"
          />
          <Icon
            name="checkbox-check"
            size="xs"
            className="pointer-events-none absolute inset-0 m-auto hidden text-on-brand peer-checked:block"
          />
        </span>
        <span id={labelId}>{label}</span>
      </label>

      {checked && (
        <div className="mt-2 ml-8 flex items-center gap-4 rounded-lg border border-default p-3">
          {/* Empty alt: the text next to it says what the image is. */}
          <Image
            src={source.url}
            alt=""
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-md bg-subtle object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="typography-body-sm text-secondary">Source image</p>
            <p className="typography-label text-primary">From Shopify</p>
          </div>
          {/* Described by the type's label, so a screen reader hears which type the Change is for. */}
          <Button ref={changeButtonRef} variant="secondary" onClick={onChangeSource} aria-describedby={labelId}>
            Change
          </Button>
        </div>
      )}
    </div>
  );
}
