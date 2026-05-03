import type { CourseInputPayload, CourseVertical } from '@/types';
import { COURSE_VERTICAL_VALUES } from '@/lib/courseVerticalOptions';

function isVertical(v: string): v is CourseVertical {
  return (COURSE_VERTICAL_VALUES as readonly string[]).includes(v);
}

/**
 * Categoría efectiva del catálogo: columna `catalog_category` si está fijada;
 * si no, `input_payload.courseVertical`; por defecto `general`.
 */
export function resolveCatalogCategory(
  catalog_category: string | null | undefined,
  input_payload: CourseInputPayload | null | undefined
): CourseVertical {
  if (typeof catalog_category === 'string' && isVertical(catalog_category)) {
    return catalog_category;
  }
  const pv = input_payload?.courseVertical;
  if (typeof pv === 'string' && isVertical(pv)) {
    return pv;
  }
  return 'general';
}
