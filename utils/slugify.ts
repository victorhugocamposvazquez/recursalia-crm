const MAX_SLUG_LEN = 80;

export function slugifyTitle(title: string): string {
  const s = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LEN)
    .replace(/-+$/g, '');
  return s || 'curso';
}

/**
 * Devuelve el primer slug disponible: `base`, `base-2`, `base-3`, …
 * No modifica `used`; el llamador debe hacer `used.add(resultado)`.
 */
export function ensureUniqueSlug(base: string, used: Set<string>): string {
  const root = base.trim() || 'item';
  let candidate = root;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${root}-${n}`;
    n += 1;
  }
  return candidate;
}
