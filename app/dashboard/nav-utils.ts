/** Coincidencia de enlace activo para rutas internas del dashboard (grupo Cursos). */
export function isCursosNavActive(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  if (href === '/dashboard') return pathname === '/dashboard';
  if (href === '/dashboard/courses') {
    return pathname === '/dashboard/courses' || pathname.startsWith('/dashboard/courses/');
  }
  return pathname === href;
}

export function isFrontNavActive(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
