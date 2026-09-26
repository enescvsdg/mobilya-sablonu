/** Panel şifreleri için en az uzunluk. */
export const MIN_PASSWORD_LENGTH = 10;

/** "ornekmobilya@gmail.com" → "or•••••@gmail.com": kodun nereye gittiğini ifşa etmeden gösterir. */
export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"•".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}
