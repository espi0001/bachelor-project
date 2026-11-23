/** The Instant Images logo with the product name, in the desktop sidebar and the mobile top bar. */

import { Logo } from "@/components/ui/logo";

// Figma uses a bigger name in the desktop sidebar (Heading/Section) than in the mobile top bar (Label).
const NAME_CLASSES = {
  desktop: "typography-heading-section",
  mobile: "typography-label",
} as const;

type BrandProps = {
  variant: keyof typeof NAME_CLASSES;
  className?: string;
};

export function Brand({ variant, className }: BrandProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <Logo />
      <span className={`${NAME_CLASSES[variant]} whitespace-nowrap text-primary dark:text-zinc-100`}>
        Instant · Images
      </span>
    </div>
  );
}
