/**
 * Error lanzado cuando el curso se creó en WordPress pero producto o temario fallaron.
 * Permite al orquestador seguir con categorías y reseñas usando el courseId.
 */
export class PartialPublishError extends Error {
  constructor(
    message: string,
    public readonly courseId: number
  ) {
    super(message);
    this.name = 'PartialPublishError';
  }
}
