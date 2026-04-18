export const CURSOS_NAV = [
  { href: '/dashboard', label: 'Generar curso' },
  { href: '/dashboard/courses', label: 'Mis cursos' },
  { href: '/dashboard/reviews', label: 'Generar reseñas' },
  { href: '/dashboard/seo-posts', label: 'Posts SEO' },
  { href: '/dashboard/docs', label: 'Documentación' },
] as const;

/** Zona Front web (contenido del sitio público) */
export const FRONT_ADMIN_NAV = [
  { href: '/dashboard/front', label: 'Contenido del sitio' },
] as const;
