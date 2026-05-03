/** PostgREST a veces devuelve FK embebidas como objeto o como array de un elemento. */
export function singularEmbed<T>(
  embed: T | T[] | null | undefined
): T | null {
  if (embed == null) return null;
  return Array.isArray(embed) ? embed[0] ?? null : embed;
}
