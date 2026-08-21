/** Only company mailboxes may access the portal. */
export const ALLOWED_EMAIL_DOMAINS = ["5team.me", "supremeuae.me"] as const;

export function emailDomain(email: string) {
  return email.trim().toLowerCase().split("@")[1] ?? "";
}

export function isCompanyEmail(email: string) {
  return (ALLOWED_EMAIL_DOMAINS as readonly string[]).includes(emailDomain(email));
}

export const DOMAIN_HINT = ALLOWED_EMAIL_DOMAINS.map((d) => `@${d}`).join(" or ");

/** Password policy: min 6 chars, at least one capital and one special character. */
export function passwordProblem(password: string): string | null {
  if (password.length < 6) return "Password must be at least 6 characters.";
  if (!/[A-Z]/.test(password)) return "Password must include at least 1 capital letter.";
  if (!/[^A-Za-z0-9]/.test(password))
    return "Password must include at least 1 special character (e.g. ! @ # $ %).";
  return null;
}
