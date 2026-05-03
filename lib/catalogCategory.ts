import type { CourseInputPayload } from '@/types';

export type CatalogCategoryPublic = { slug: string; label: string };

/** Si `catalog_categories` aún no existe en BD, el listado /cursos sigue siendo usable. */
export const PUBLIC_CATALOG_CATEGORIES_FALLBACK: CatalogCategoryPublic[] = [
  { slug: 'general', label: 'General' },
  { slug: 'professional_soft', label: 'Profesional' },
  { slug: 'creative', label: 'Creativo' },
  { slug: 'technical_skills', label: 'Técnico' },
  { slug: 'photography', label: 'Fotografía' },
];

const DEFAULT_SLUG = 'general';

/** Valida y normaliza slug al crear categoría (panel). */
export function normalizeCatalogSlugForCreate(raw: string): string | null {
  const t = raw.trim().toLowerCase();
  if (!/^[a-z][a-z0-9_-]*$/.test(t)) return null;
  return t;
}

/**
 * Slug efectivo para filtrar/asignar: columna `catalog_category` si está fijada;
 * si no, `input_payload.courseVertical`; último recurso `general`.
 */
export function resolveCourseCatalogSlug(
  catalog_category: string | null | undefined,
  input_payload: CourseInputPayload | null | undefined
): string {
  const c = catalog_category?.trim();
  if (c) return c.toLowerCase();
  const v = input_payload?.courseVertical;
  if (typeof v === 'string' && v.trim()) return v.trim().toLowerCase();
  return DEFAULT_SLUG;
}

export function categoryLabel(
  slug: string,
  options: CatalogCategoryPublic[]
): string {
  return options.find((o) => o.slug === slug)?.label ?? slug;
}
