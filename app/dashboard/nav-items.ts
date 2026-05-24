export const CURSOS_NAV = [
  { href: '/dashboard', label: 'Generar curso' },
  { href: '/dashboard/operations', label: 'Operaciones' },
  { href: '/dashboard/catalog-categories', label: 'Categorías /cursos' },
  { href: '/dashboard/gastos-ia', label: 'Gastos IA' },
  { href: '/dashboard/courses', label: 'Mis cursos' },
  { href: '/dashboard/reviews', label: 'Reseñas' },
  { href: '/dashboard/seo-posts', label: 'Posts SEO' },
  { href: '/dashboard/blog', label: 'Blog' },
  { href: '/dashboard/docs', label: 'Documentación' },
] as const;

/** Zona Front web (contenido del sitio público) */
export const FRONT_ADMIN_NAV = [
  { href: '/dashboard/front', label: 'Contenido del sitio' },
] as const;

/** Accesos al área alumno (vista LMS desde el admin) */
export const APRENDER_NAV = [
  { href: '/aprender', label: 'Área alumno' },
] as const;

/** Administración interna */
export const ADMIN_NAV = [
  { href: '/dashboard/usuarios', label: 'Usuarios y roles' },
] as const;
