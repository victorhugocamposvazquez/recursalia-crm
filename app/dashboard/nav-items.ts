export const CURSOS_NAV = [
  { href: '/dashboard', label: 'Generar curso' },
  { href: '/dashboard/courses', label: 'Mis cursos' },
  { href: '/dashboard/reviews', label: 'Generar reseñas' },
  { href: '/dashboard/seo-posts', label: 'Posts SEO' },
  { href: '/dashboard/docs', label: 'Documentación' },
] as const;

/** Enlaces al sitio público (misma origen) */
export const FRONT_WEB_NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/cursos', label: 'Catálogo de cursos' },
  { href: '/blog', label: 'Blog' },
  { href: '/inspiracion', label: 'Inspiración' },
] as const;

export type NavTab = 'cursos' | 'front';
