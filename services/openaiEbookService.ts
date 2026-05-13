/**
 * Genera contenido extenso para cada lección del curso (solo para el PDF/ebook).
 *
 * Pipeline:
 *  1) `buildEditorialPlan` (1 llamada): plan editorial coherente del curso.
 *  2) Expansión por lección con el plan como contexto, devolviendo bloques
 *     estructurados (intro / body / example / exercise / commonMistakes /
 *     checklist / keyPoints). Paralela con concurrencia limitada.
 *
 * Si el plan editorial falla, hacemos fallback a una expansión "legacy"
 * (prompt anterior, texto plano) para no romper la generación.
 */

import OpenAI from 'openai';
import type { GeneratedCourseStructure } from '@/types';
import { resolveAiModel } from '@/lib/aiModels';
import { logOpenAiChatUsage } from '@/services/aiUsageLogService';
import {
  buildEditorialPlan,
  type EditorialPlan,
  type LessonPlan,
  type ModulePlan,
} from '@/services/openaiEditorialPlan';

const CONCURRENCY = 6;

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY required');
  return new OpenAI({ apiKey: key });
}

/**
 * Estructura enriquecida de una lección. `content` se mantiene como fallback
 * para compatibilidad con el renderer y otros consumidores.
 */
export interface ExpandedLesson {
  title: string;
  /** Texto plano "todo en uno" (fallback histórico, también lo poblamos siempre). */
  content: string;
  intro?: string;
  body?: string;
  example?: string;
  exercise?: string;
  commonMistakes?: string[];
  checklist?: string[];
  keyPoints?: string[];
}

export interface ExpandedTopic {
  title: string;
  lessons: ExpandedLesson[];
  summary?: string;
  objectives?: string[];
}

export interface GlossaryEntry {
  term: string;
  definition: string;
}

export interface ExpandedCourseContent {
  title: string;
  short_description: string;
  description: string;
  author_name?: string;
  author_bio?: string;
  topics: ExpandedTopic[];
  /** Plan editorial empleado (si la fase no ha caído al fallback). */
  editorialPlan?: EditorialPlan;
  /** Glosario candidato del plan, expuesto a nivel curso (para PDF futuro). */
  glossaryCandidates?: string[];
  /** Glosario con definiciones resueltas (Hito 2). */
  glossary?: GlossaryEntry[];
}

export type ProgressCallback = (
  current: number,
  total: number,
  lessonTitle: string
) => void;

export function countLessons(content: GeneratedCourseStructure): number {
  return (content.topics ?? []).reduce((sum, t) => sum + t.lessons.length, 0);
}

// ────────────────────────────────────────────────────────────────────────────
// Expansión enriquecida
// ────────────────────────────────────────────────────────────────────────────

interface RichJobContext {
  courseTitle: string;
  courseShortDesc: string;
  module: ModulePlan;
  lesson: LessonPlan;
  /** Lecciones previas del mismo módulo (índices < lesson.index). */
  previousLessonsInModule: LessonPlan[];
  /** Resumen de módulos anteriores (1-2 frases cada uno). */
  earlierModulesSummary: { title: string; summary: string }[];
  /** Perfil sugerido para el "ejemplo" de esta lección (para diversidad). */
  exampleProfile: ExampleProfile;
  /** Nombres ya usados en otras lecciones del mismo curso (a evitar). */
  forbiddenNames: string[];
}

interface ExampleProfile {
  /** Nombre propio sugerido (el modelo puede adaptarlo si rompe la coherencia). */
  name: string;
  /** Edad orientativa (años). */
  age: number;
  /** Género o etiqueta no binaria descriptiva. */
  gender: 'mujer' | 'hombre' | 'persona no binaria';
  /** Ciudad de referencia (variedad geográfica). */
  city: string;
  /** Contexto profesional o vital. */
  context: string;
}

/**
 * Pool de perfiles para diversificar los ejemplos. Rotamos por índice global
 * de la lección (curso → módulo → lección) para que los nombres no se repitan
 * entre lecciones del mismo curso.
 */
const EXAMPLE_PROFILES: readonly ExampleProfile[] = [
  { name: 'Alejandro', age: 28, gender: 'hombre', city: 'Bilbao', context: 'ingeniero de software que pasa el día sentado y entrena tres tardes a la semana' },
  { name: 'Sofía', age: 22, gender: 'mujer', city: 'Madrid', context: 'estudiante de último año que combina prácticas con preparación para una media maratón' },
  { name: 'Roberto', age: 45, gender: 'hombre', city: 'Valencia', context: 'autónomo del sector logístico que retoma el ejercicio tras una década inactivo' },
  { name: 'Inés', age: 54, gender: 'mujer', city: 'Sevilla', context: 'profesora de instituto que busca mantener energía y fuerza durante la menopausia' },
  { name: 'Javier', age: 33, gender: 'hombre', city: 'Zaragoza', context: 'padre de dos hijos pequeños con apenas tres horas semanales disponibles' },
  { name: 'Patricia', age: 38, gender: 'mujer', city: 'Barcelona', context: 'ejecutiva que viaja a menudo y necesita rutinas adaptables a hoteles' },
  { name: 'Marco', age: 62, gender: 'hombre', city: 'Málaga', context: 'jubilado activo que prioriza autonomía funcional y prevención de caídas' },
  { name: 'Lucía', age: 27, gender: 'mujer', city: 'Granada', context: 'freelance creativa con vida muy sedentaria desde el confinamiento' },
  { name: 'Tomás', age: 41, gender: 'hombre', city: 'Murcia', context: 'comercial con lumbalgia recurrente que quiere reforzar el core' },
  { name: 'Carla', age: 19, gender: 'mujer', city: 'Vigo', context: 'universitaria que se inicia en el gimnasio y nunca había entrenado' },
  { name: 'David', age: 50, gender: 'hombre', city: 'Pamplona', context: 'médico con hipertensión controlada que quiere bajar grasa corporal' },
  { name: 'Andrea', age: 35, gender: 'mujer', city: 'Las Palmas', context: 'fisioterapeuta que entrena CrossFit y busca técnica de levantamientos' },
  { name: 'Iván', age: 24, gender: 'hombre', city: 'A Coruña', context: 'opositor que pasa diez horas estudiando y necesita romper el sedentarismo' },
  { name: 'Noelia', age: 47, gender: 'mujer', city: 'Salamanca', context: 'enfermera con turnos rotatorios que entrena cuando puede' },
  { name: 'Hugo', age: 31, gender: 'hombre', city: 'Alicante', context: 'cocinero que pasa el día de pie y arrastra molestias en rodillas' },
  { name: 'Sara', age: 58, gender: 'mujer', city: 'Logroño', context: 'directiva próxima a jubilarse que quiere mantener masa muscular' },
];

function pickProfileForLesson(globalIdx: number): ExampleProfile {
  const i = ((globalIdx % EXAMPLE_PROFILES.length) + EXAMPLE_PROFILES.length) %
    EXAMPLE_PROFILES.length;
  return EXAMPLE_PROFILES[i];
}

interface RichLessonOutput {
  intro: string;
  body: string;
  example: string;
  exercise: string;
  commonMistakes: string[];
  checklist: string[];
  keyPoints: string[];
}

function buildRichLessonPrompt(ctx: RichJobContext): string {
  const previous = ctx.previousLessonsInModule
    .map(
      (l) =>
        `· ${l.title} → conceptos ya cubiertos: ${l.keyConcepts.join(', ') || '(n/d)'}`
    )
    .join('\n');

  const earlier = ctx.earlierModulesSummary
    .map((m, i) => `${i + 1}) ${m.title}: ${m.summary || '(sin resumen)'}`)
    .join('\n');

  const p = ctx.exampleProfile;
  const forbiddenNamesText =
    ctx.forbiddenNames.length > 0
      ? ctx.forbiddenNames.join(', ')
      : '(ninguno aún)';

  return `Eres un escritor experto en contenido educativo de pago. Redactas en castellano, claro, profesional y aplicado.

CURSO: ${ctx.courseTitle}
${ctx.courseShortDesc ? `Resumen del curso: ${ctx.courseShortDesc}` : ''}

MÓDULO: ${ctx.module.title}
Objetivos del módulo: ${ctx.module.objectives.join(' | ') || '(n/d)'}
Resumen del módulo: ${ctx.module.summary || '(n/d)'}

CONTEXTO PREVIO (NO repetir definiciones ya cubiertas):
- Lecciones anteriores de este módulo:
${previous || '(esta es la primera lección del módulo)'}
- Módulos anteriores del curso:
${earlier || '(este es el primer módulo)'}

LECCIÓN A REDACTAR: ${ctx.lesson.title}
- Resultado de aprendizaje (intent): ${ctx.lesson.intent}
- Conceptos clave a trabajar AQUÍ: ${ctx.lesson.keyConcepts.join(', ') || '(n/d)'}
- Asume como conocido (NO redefinir): ${ctx.lesson.assumesKnown.join(', ') || '(n/d)'}
- Sugerencia de ejemplo (del plan editorial): ${ctx.lesson.suggestedExample || '(libre)'}
- Sugerencia de ejercicio (del plan editorial): ${ctx.lesson.suggestedExercise || '(libre)'}

PERFIL OBLIGATORIO PARA EL "example" DE ESTA LECCIÓN (varía para evitar clichés):
- Nombre: ${p.name} (${p.gender}, ${p.age} años, ${p.city})
- Contexto: ${p.context}
- Nombres ya usados en otras lecciones de este curso (NO uses ninguno de estos en tu "example"): ${forbiddenNamesText}

DEVUELVE UN ÚNICO JSON VÁLIDO con esta forma:
{
  "intro": "string (80-150 palabras, sin definir nada que ya esté en assumesKnown; engancha con el resultado de aprendizaje)",
  "body": "string (1200-1800 palabras; texto plano con párrafos separados por líneas en blanco; estructura: contexto → desarrollo conceptual → cómo se aplica → matices y casos límite; no uses títulos internos, no uses markdown)",
  "example": "string (200-300 palabras; debe protagonizarlo EXACTAMENTE el perfil indicado arriba, usando su nombre, edad, ciudad y contexto vital; debe ser específico, con cifras o decisiones concretas; ilustra los conceptos clave de ESTA lección sin redefinir lo de assumesKnown)",
  "exercise": "string (120-200 palabras; un ejercicio aplicado paso a paso que el alumno pueda realizar tras leer la lección; indica qué entregable produce)",
  "commonMistakes": ["3-5 errores frecuentes con explicación corta de por qué se producen y cómo evitarlos"],
  "checklist": ["4-6 ítems accionables que el alumno debería poder confirmar tras la lección"],
  "keyPoints": ["4-5 ideas clave en una frase cada una; sin numeración"]
}

REGLAS DE ESTILO:
1. Castellano de España, registro profesional y accesible. No uses tú/usted alternados; mantén "tú".
2. NO uses emojis ni markdown. Solo texto plano dentro de cada string. Si necesitas listas, usa los arrays del JSON, no guiones dentro de los strings.
3. NO redefinas los conceptos en "assumesKnown" ni los presentes en lecciones previas listadas arriba.
4. Cita los conceptos clave de la lección al menos una vez en "body".
5. "example" DEBE protagonizarlo el perfil indicado arriba con su nombre exacto; no inventes otros nombres ni reutilices nombres prohibidos.
6. "exercise" debe ser autocontenido y verificable (el alumno sabe si lo hizo bien).
7. Todo el contenido va en castellano. No mezcles idiomas salvo nombres propios.`;
}

async function expandLessonRich(
  openai: OpenAI,
  model: string,
  ctx: RichJobContext,
  courseId?: string | null
): Promise<RichLessonOutput> {
  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'Eres un escritor pedagógico experto. Devuelves SOLO JSON válido, sin markdown, sin emojis, en castellano.',
      },
      { role: 'user', content: buildRichLessonPrompt(ctx) },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  logOpenAiChatUsage('ebook_lesson_expand_rich', model, response.usage, courseId, {
    lesson_title: ctx.lesson.title,
    topic_title: ctx.module.title,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? '';
  if (!raw) throw new Error('Lesson expansion: empty response');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Lesson expansion: invalid JSON (${err instanceof Error ? err.message : String(err)})`
    );
  }

  return normalizeRichLesson(parsed);
}

function normalizeRichLesson(parsed: unknown): RichLessonOutput {
  const obj =
    typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};

  return {
    intro: asNonEmptyString(obj.intro),
    body: asNonEmptyString(obj.body),
    example: asNonEmptyString(obj.example),
    exercise: asNonEmptyString(obj.exercise),
    commonMistakes: asStringArray(obj.commonMistakes).slice(0, 8),
    checklist: asStringArray(obj.checklist).slice(0, 10),
    keyPoints: asStringArray(obj.keyPoints).slice(0, 8),
  };
}

function asNonEmptyString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map((x) => x.trim());
}

/** Fusiona los bloques en un texto plano legible para consumidores legacy. */
function flattenRichToContent(rich: RichLessonOutput): string {
  const out: string[] = [];
  if (rich.intro) out.push(rich.intro);
  if (rich.body) out.push(rich.body);
  if (rich.example) out.push(`Ejemplo:\n${rich.example}`);
  if (rich.exercise) out.push(`Ejercicio práctico:\n${rich.exercise}`);
  if (rich.commonMistakes.length > 0) {
    out.push(
      `Errores comunes:\n${rich.commonMistakes.map((m, i) => `${i + 1}. ${m}`).join('\n')}`
    );
  }
  if (rich.checklist.length > 0) {
    out.push(
      `Checklist:\n${rich.checklist.map((c) => `- ${c}`).join('\n')}`
    );
  }
  if (rich.keyPoints.length > 0) {
    out.push(
      `Puntos clave:\n${rich.keyPoints.map((k, i) => `${i + 1}. ${k}`).join('\n')}`
    );
  }
  return out.join('\n\n');
}

// ────────────────────────────────────────────────────────────────────────────
// Fallback legacy (mismo prompt que antes; solo texto plano)
// ────────────────────────────────────────────────────────────────────────────

async function expandLessonLegacy(
  openai: OpenAI,
  model: string,
  courseTitle: string,
  topicTitle: string,
  lessonTitle: string,
  lessonBrief: string,
  courseId?: string | null
): Promise<string> {
  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'Eres un escritor experto en contenido educativo. Escribes en castellano, de forma clara, profesional y detallada. No uses emojis. No uses markdown; devuelve texto plano con lineas en blanco para separar parrafos.',
      },
      {
        role: 'user',
        content: `Escribe el contenido completo de la leccion "${lessonTitle}" del modulo "${topicTitle}" del curso "${courseTitle}".

Contexto breve de la leccion:
${lessonBrief}

INSTRUCCIONES:
- Escribe entre 800 y 1200 palabras.
- Estructura: introduccion breve, desarrollo con ejemplos, y "Puntos clave" al final (4-5 ideas numeradas).
- Tono profesional pero accesible.
- Sin emojis, sin markdown. Solo texto plano con parrafos separados por lineas en blanco.
- Incluye algun ejemplo practico o caso real.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  logOpenAiChatUsage('ebook_lesson_expand', model, response.usage, courseId, {
    lesson_title: lessonTitle,
    topic_title: topicTitle,
    fallback: true,
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
}

// ────────────────────────────────────────────────────────────────────────────
// Orquestación
// ────────────────────────────────────────────────────────────────────────────

interface LessonJob {
  topicIdx: number;
  lessonIdx: number;
  topicTitle: string;
  lessonTitle: string;
  brief: string;
}

export async function expandCourseForEbook(
  content: GeneratedCourseStructure,
  onProgress?: ProgressCallback,
  courseId?: string | null
): Promise<ExpandedCourseContent> {
  const openai = getOpenAI();
  const total = countLessons(content);
  const lessonModel = resolveAiModel('lessonExpand');
  const legacyModel = resolveAiModel('ebookLessonExpandLegacy');

  // 1) Plan editorial. Si falla, caemos al pipeline legacy.
  let plan: EditorialPlan | null = null;
  try {
    plan = await buildEditorialPlan(content, courseId ?? null);
  } catch (err) {
    console.warn(
      '[expandCourseForEbook] editorial plan failed; falling back to legacy expansion:',
      err instanceof Error ? err.message : err
    );
  }

  // 2) Expansión.
  if (plan) {
    return expandWithPlan(
      openai,
      lessonModel,
      content,
      plan,
      onProgress,
      courseId
    );
  }
  return expandLegacy(openai, legacyModel, content, total, onProgress, courseId);
}

async function expandWithPlan(
  openai: OpenAI,
  model: string,
  content: GeneratedCourseStructure,
  plan: EditorialPlan,
  onProgress: ProgressCallback | undefined,
  courseId?: string | null
): Promise<ExpandedCourseContent> {
  const total = countLessons(content);
  let completed = 0;

  // Pre-calculamos los resúmenes acumulados por módulo (módulos < current).
  const moduleSummaries = plan.modules.map((m) => ({
    title: m.title,
    summary: m.summary,
  }));

  type Result = { ti: number; li: number; rich: RichLessonOutput };
  const results: Result[] = [];

  type Job = {
    ti: number;
    li: number;
    ctx: RichJobContext;
  };

  const jobs: Job[] = [];
  /**
   * Construimos un índice global de lección para rotar el perfil determinístico,
   * y vamos acumulando los nombres ya asignados para prohibírselos al resto.
   */
  const assignedNames: string[] = [];
  let globalIdx = 0;

  for (let ti = 0; ti < plan.modules.length; ti++) {
    const modulePlan = plan.modules[ti];
    const earlier = moduleSummaries.slice(0, ti);

    for (let li = 0; li < modulePlan.lessons.length; li++) {
      const lessonPlan = modulePlan.lessons[li];
      const previous = modulePlan.lessons.slice(0, li);
      const profile = pickProfileForLesson(globalIdx);
      globalIdx += 1;
      jobs.push({
        ti,
        li,
        ctx: {
          courseTitle: content.title,
          courseShortDesc: content.short_description ?? '',
          module: modulePlan,
          lesson: lessonPlan,
          previousLessonsInModule: previous,
          earlierModulesSummary: earlier,
          exampleProfile: profile,
          forbiddenNames: assignedNames.filter((n) => n !== profile.name),
        },
      });
      assignedNames.push(profile.name);
    }
  }

  // El primer pase no conoce los nombres posteriores; recalculamos `forbiddenNames`
  // como "todos los nombres asignados al curso menos el propio" para que en el
  // prompt cada lección vea la lista completa.
  for (const j of jobs) {
    j.ctx.forbiddenNames = assignedNames.filter(
      (n) => n !== j.ctx.exampleProfile.name
    );
  }

  async function runJob(job: Job) {
    try {
      const rich = await expandLessonRich(openai, model, job.ctx, courseId);
      results.push({ ti: job.ti, li: job.li, rich });
    } catch (err) {
      console.warn(
        `[expandCourseForEbook] lesson ${job.ti + 1}.${job.li + 1} rich failed; saving minimal fallback:`,
        err instanceof Error ? err.message : err
      );
      results.push({
        ti: job.ti,
        li: job.li,
        rich: {
          intro: '',
          body:
            'No se pudo expandir esta lección automáticamente. El equipo editorial la revisará antes de publicar.',
          example: '',
          exercise: '',
          commonMistakes: [],
          checklist: [],
          keyPoints: [],
        },
      });
    }
    completed++;
    onProgress?.(completed, total, job.ctx.lesson.title);
  }

  const pending = [...jobs];
  const active: Promise<void>[] = [];
  while (pending.length > 0 || active.length > 0) {
    while (active.length < CONCURRENCY && pending.length > 0) {
      const job = pending.shift()!;
      const p = runJob(job).then(() => {
        active.splice(active.indexOf(p), 1);
      });
      active.push(p);
    }
    if (active.length > 0) await Promise.race(active);
  }

  const byKey = new Map<string, RichLessonOutput>();
  for (const r of results) byKey.set(`${r.ti}-${r.li}`, r.rich);

  const topics: ExpandedTopic[] = (content.topics ?? []).map((topic, ti) => {
    const modulePlan = plan.modules[ti];
    return {
      title: topic.title,
      summary: modulePlan?.summary,
      objectives: modulePlan?.objectives,
      lessons: topic.lessons.map((lesson, li) => {
        const rich = byKey.get(`${ti}-${li}`);
        if (!rich) {
          return {
            title: lesson.title,
            content: '',
          };
        }
        return {
          title: lesson.title,
          content: flattenRichToContent(rich),
          intro: rich.intro || undefined,
          body: rich.body || undefined,
          example: rich.example || undefined,
          exercise: rich.exercise || undefined,
          commonMistakes:
            rich.commonMistakes.length > 0 ? rich.commonMistakes : undefined,
          checklist: rich.checklist.length > 0 ? rich.checklist : undefined,
          keyPoints: rich.keyPoints.length > 0 ? rich.keyPoints : undefined,
        };
      }),
    };
  });

  // Glosario (Hito 2): si hay candidatos, lo resolvemos en paralelo al final.
  // Si falla, omitimos la sección sin romper la generación.
  let glossary: GlossaryEntry[] | undefined;
  if (plan.glossaryCandidates && plan.glossaryCandidates.length > 0) {
    try {
      const { buildGlossary } = await import('@/services/openaiGlossary');
      glossary = await buildGlossary({
        courseTitle: content.title,
        courseShortDesc: content.short_description ?? '',
        candidates: plan.glossaryCandidates,
        courseId,
      });
    } catch (err) {
      console.warn(
        '[expandCourseForEbook] glossary build failed; skipping:',
        err instanceof Error ? err.message : err
      );
    }
  }

  return {
    title: content.title,
    short_description: content.short_description,
    description: content.description,
    author_name: content.author_name,
    author_bio: content.author_bio,
    topics,
    editorialPlan: plan,
    glossaryCandidates: plan.glossaryCandidates,
    glossary,
  };
}

async function expandLegacy(
  openai: OpenAI,
  model: string,
  content: GeneratedCourseStructure,
  total: number,
  onProgress: ProgressCallback | undefined,
  courseId?: string | null
): Promise<ExpandedCourseContent> {
  const jobs: LessonJob[] = [];
  for (let ti = 0; ti < (content.topics ?? []).length; ti++) {
    const topic = content.topics![ti];
    for (let li = 0; li < topic.lessons.length; li++) {
      const lesson = topic.lessons[li];
      jobs.push({
        topicIdx: ti,
        lessonIdx: li,
        topicTitle: topic.title,
        lessonTitle: lesson.title,
        brief: lesson.content
          ? lesson.content.replace(/<[^>]*>/g, '').slice(0, 500)
          : lesson.title,
      });
    }
  }

  const results = new Map<string, string>();
  let completed = 0;

  async function runJob(job: LessonJob) {
    const text = await expandLessonLegacy(
      openai,
      model,
      content.title,
      job.topicTitle,
      job.lessonTitle,
      job.brief,
      courseId
    );
    results.set(`${job.topicIdx}-${job.lessonIdx}`, text);
    completed++;
    onProgress?.(completed, total, job.lessonTitle);
  }

  const pending = [...jobs];
  const active: Promise<void>[] = [];
  while (pending.length > 0 || active.length > 0) {
    while (active.length < CONCURRENCY && pending.length > 0) {
      const job = pending.shift()!;
      const p = runJob(job).then(() => {
        active.splice(active.indexOf(p), 1);
      });
      active.push(p);
    }
    if (active.length > 0) await Promise.race(active);
  }

  const topics: ExpandedTopic[] = (content.topics ?? []).map((topic, ti) => ({
    title: topic.title,
    lessons: topic.lessons.map((lesson, li) => ({
      title: lesson.title,
      content: results.get(`${ti}-${li}`) ?? '',
    })),
  }));

  return {
    title: content.title,
    short_description: content.short_description,
    description: content.description,
    author_name: content.author_name,
    author_bio: content.author_bio,
    topics,
  };
}
