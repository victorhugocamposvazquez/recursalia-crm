/**
 * Rutas en las que el alumno está dentro de un curso concreto: el header
 * global de Recursalia (logo + menú + login) se reemplaza por un header
 * contextual con curso/módulo/lección y la bottom-nav móvil se oculta.
 */
export function isImmersiveLearnRoute(pathname: string): boolean {
  return /^\/aprender\/cursos\/[^/]+/.test(pathname);
}
