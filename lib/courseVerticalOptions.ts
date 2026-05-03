import type { CourseVertical } from '@/types';

export const COURSE_VERTICAL_VALUES: CourseVertical[] = [
  'general',
  'professional_soft',
  'creative',
  'technical_skills',
];

export const COURSE_VERTICAL_OPTIONS: { value: CourseVertical; label: string }[] = [
  { value: 'general', label: 'General (publico amplio)' },
  { value: 'professional_soft', label: 'Habilidades profesionales (liderazgo, equipo…)' },
  { value: 'creative', label: 'Creativo (diseno, marca, contenidos)' },
  { value: 'technical_skills', label: 'Tecnico práctico (herramientas, desarrollo)' },
];
