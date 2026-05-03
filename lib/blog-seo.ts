/** Slug estable para URLs: minúsculas, guiones, sin caracteres conflictivos SEO. */
export function sanitizeSlugForUrl(input: string): string {
  const s = input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return s || 'post';
}

export function siteCanonicalBase(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  return raw || 'http://localhost:3000';
}
