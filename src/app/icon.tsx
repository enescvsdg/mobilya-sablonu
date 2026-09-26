import { brandIcon } from "@/lib/brand-icon";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** Sekme simgesi; /favicon.ico da buna yönlenir (next.config.ts). */
export default function Icon() {
  return brandIcon(size.width);
}
