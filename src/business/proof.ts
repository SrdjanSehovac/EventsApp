/**
 * DIGITAL proof helpers: website + business-email domain, never ID or face.
 */

export function normalizeWebsite(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function websiteHost(website: string): string | null {
  try {
    const url = new URL(normalizeWebsite(website));
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();
    return host || null;
  } catch {
    return null;
  }
}

export function emailDomain(email: string): string | null {
  const domain = email.split('@')[1]?.trim().toLowerCase();
  return domain || null;
}

/** True when the mailbox sits on the same registrable host as the site. */
export function domainsAlign(website: string, email: string): boolean {
  const host = websiteHost(website);
  const domain = emailDomain(email);
  if (!host || !domain) return false;
  return host === domain || host.endsWith(`.${domain}`) || domain.endsWith(`.${host}`);
}

export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function looksLikeWebsite(value: string): boolean {
  return websiteHost(value) !== null && value.includes('.');
}
