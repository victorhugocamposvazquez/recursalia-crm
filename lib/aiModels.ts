/**
 * Resolución centralizada de modelos OpenAI por etapa del pipeline de cursos.
 *
 * Cada etapa puede sobreescribirse por variable de entorno. Los defaults usan
 * `gpt-4.1-mini` (mejor relación calidad/coste que `gpt-4o-mini` para texto
 * editorial largo, según pruebas internas).
 *
 * Coste aprox. por curso (6×4 lecciones) con la expansión enriquecida:
 *   - gpt-4o-mini  ≈ $0.07
 *   - gpt-4.1-mini ≈ $0.19
 *   - gpt-4.1      ≈ $0.94
 */

export type AiPipelineStage =
  | 'courseStructure'
  | 'editorialPlan'
  | 'lessonExpand'
  | 'lessonRewrite'
  | 'ebookLessonExpandLegacy'
  | 'glossary'
  | 'reviews'
  | 'quizGenerate';

const DEFAULT_MODEL = 'gpt-4.1-mini';

const ENV_KEYS: Record<AiPipelineStage, string> = {
  courseStructure: 'OPENAI_MODEL_COURSE_STRUCTURE',
  editorialPlan: 'OPENAI_MODEL_EDITORIAL_PLAN',
  lessonExpand: 'OPENAI_MODEL_LESSON_EXPAND',
  lessonRewrite: 'OPENAI_MODEL_LESSON_REWRITE',
  ebookLessonExpandLegacy: 'OPENAI_MODEL_LESSON_EXPAND_LEGACY',
  glossary: 'OPENAI_MODEL_GLOSSARY',
  reviews: 'OPENAI_MODEL_REVIEWS',
  quizGenerate: 'OPENAI_MODEL_QUIZ_GENERATE',
};

export function resolveAiModel(stage: AiPipelineStage): string {
  const fromEnv = process.env[ENV_KEYS[stage]]?.trim();
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  return DEFAULT_MODEL;
}

/** Snapshot legible para logs / debugging. */
export function describeAiModels(): Record<AiPipelineStage, string> {
  return {
    courseStructure: resolveAiModel('courseStructure'),
    editorialPlan: resolveAiModel('editorialPlan'),
    lessonExpand: resolveAiModel('lessonExpand'),
    lessonRewrite: resolveAiModel('lessonRewrite'),
    ebookLessonExpandLegacy: resolveAiModel('ebookLessonExpandLegacy'),
    glossary: resolveAiModel('glossary'),
    reviews: resolveAiModel('reviews'),
    quizGenerate: resolveAiModel('quizGenerate'),
  };
}
