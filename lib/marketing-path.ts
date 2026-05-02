/** `/cursos/mi-slug` (exclude `/cursos` and deeper paths). */
export function isMarketingCourseLandingPath(pathname: string | null): boolean {
  return Boolean(pathname && /^\/cursos\/[^/]+$/.test(pathname));
}
