/** The Instant Images logo mark from the Figma style guide (Logo 160:824). */

import Image from "next/image";

// Decorative: the logo always stands next to the product name, which says the same.
export function Logo() {
  return <Image src="/logo.svg" alt="" width={28} height={28} className="size-7 shrink-0" priority />;
}
