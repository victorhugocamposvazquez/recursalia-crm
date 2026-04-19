/** Textos y opciones del flujo Inspiración (UX tipo guía por pasos). */

export const WORLDS = [
  { id: 'tech', label: 'Tecnología', emoji: '⚡️' },
  { id: 'business', label: 'Negocios', emoji: '📊' },
  { id: 'data', label: 'Datos', emoji: '📈' },
  { id: 'creative', label: 'Creatividad', emoji: '🎨' },
  { id: 'wellbeing', label: 'Bienestar', emoji: '🧠' },
  { id: 'languages', label: 'Idiomas', emoji: '💬' },
  { id: 'health', label: 'Salud', emoji: '🌱' },
  { id: 'leadership', label: 'Liderazgo', emoji: '🎯' },
] as const;

export const FROM_OPTIONS = [
  { id: 'zero', label: 'Empiezo desde cero', emoji: '🌱' },
  { id: 'bases', label: 'Tengo bases, quiero mejorar', emoji: '📚' },
  { id: 'specialize', label: 'Busco especializarme', emoji: '🎯' },
  { id: 'update', label: 'Actualización profesional', emoji: '🚀' },
] as const;

export const GOAL_OPTIONS = [
  { id: 'job', label: 'Conseguir un nuevo trabajo', emoji: '💼' },
  { id: 'grow', label: 'Crecer en mi carrera actual', emoji: '📈' },
  { id: 'freelance', label: 'Emprender o freelance', emoji: '🧑‍💻' },
  { id: 'curiosity', label: 'Solo por curiosidad', emoji: '✨' },
] as const;

export type WorldId = (typeof WORLDS)[number]['id'];
export type FromId = (typeof FROM_OPTIONS)[number]['id'];
export type GoalId = (typeof GOAL_OPTIONS)[number]['id'];
