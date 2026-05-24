// components/learn/types.ts
// Tipos compartidos entre componentes del módulo Recursalia Learn.
// Cuando conectes con Supabase, alinea estos con tus rows tras
// `select * from courses` etc. (campos pueden ser opcionales si tu schema difiere).

export type AccentKey = 'lime' | 'blue' | 'coral' | 'violet';

export interface TweakOptions {
  /** Modo oscuro */
  dark?: boolean;
  /** Color de acento activo */
  accent?: AccentKey;
}

export type LessonKind = 'video' | 'text' | 'audio' | 'quiz' | 'boss';
export type LessonState = 'done' | 'current' | 'next' | 'locked';

export interface Lesson {
  id: string;
  /** Código visible tipo 1.2 (opcional; si no, se usa id). */
  code?: string;
  kind: LessonKind;
  title: string;
  dur: string;
  state: LessonState;
  /** Solo para quizzes ya completados */
  score?: number;
}

export interface Module {
  n: number;
  /** UUID del topic dentro de `generated_content.topics` — usado para enlazar el quiz de módulo. */
  topicId?: string;
  title: string;
  summary: string;
  isFinal?: boolean;
  lessons: Lesson[];
}

export interface Course {
  slug: string;
  title: string;
  tag: string;
  instructor: string;
  instructorRole: string;
  duration: string;
  lessons: number;
  level: string;
  color: string;
  completion: number;
  streak: number;
  xp: number;
}

// ── Quizzes ────────────────────────────────────────────────────────────────

export type QuestionKind = 'single' | 'multi' | 'tf' | 'image' | 'order';

export interface SingleChoiceQuestion {
  kind: 'single';
  text: string;
  hint?: string;
  options: string[];
  correct: number;
  explanation?: string;
}

export interface TrueFalseQuestion {
  kind: 'tf';
  text: string;
  correct: boolean;
  explanation?: string;
}

export interface ImageQuestion {
  kind: 'image';
  text: string;
  hint?: string;
  options: Array<{ id: string; label: string; imageUrl?: string; placeholderKind?: 'thirds' | 'center' | 'lines' | 'pattern' }>;
  correct: string;
  explanation?: string;
}

export interface OrderQuestion {
  kind: 'order';
  text: string;
  hint?: string;
  items: Array<{ id: string; text: string }>;
  correctOrder: string[];
  explanation?: string;
}

export type QuizQuestion = SingleChoiceQuestion | TrueFalseQuestion | ImageQuestion | OrderQuestion;

// ── Estado de juego ────────────────────────────────────────────────────────

export interface QuizSessionState {
  step: number;
  total: number;
  hearts: number;
  combo: number;
  xpEarned: number;
}

// ── Diploma ────────────────────────────────────────────────────────────────

export interface Diploma {
  certNumber: string;
  studentName: string;
  courseTitle: string;
  instructor: string;
  ceo: string;
  date: string;
  score: string;
  lessons: string;
  verifyUrl: string;
}
