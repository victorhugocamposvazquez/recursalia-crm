/** Autor institucional por defecto (landing, PDF, prompts). */
export const COURSE_AUTHOR_NAME_DEFAULT = 'Recursalia Elite Team';
export const COURSE_AUTHOR_BIO_DEFAULT =
  'Temario creado y auditado por el equipo de expertos de Recursalia.';

const LEGACY_PLACEHOLDER_AUTHOR = /^john\s*alex$/i;

/**
 * Sustituye el placeholder histórico «John Alex» y filas sin nombre por el equipo Recursalia.
 * Si hay otro autor explícito en JSON, se conserva.
 */
export function resolveCourseAuthorDisplay(
  authorName?: string | null,
  authorBio?: string | null
): { name: string; bio: string } {
  const n = authorName?.trim() ?? '';
  const b = authorBio?.trim() ?? '';

  if (!n || LEGACY_PLACEHOLDER_AUTHOR.test(n)) {
    return { name: COURSE_AUTHOR_NAME_DEFAULT, bio: COURSE_AUTHOR_BIO_DEFAULT };
  }

  return {
    name: n,
    bio: b || COURSE_AUTHOR_BIO_DEFAULT,
  };
}
