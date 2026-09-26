import { brandIcon } from "@/lib/brand-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iPhone/iPad ana ekran simgesi. */
export default function AppleIcon() {
  return brandIcon(size.width);
}
