/**
 * Generación de quizzes con OpenAI.
 *
 * `generateModuleQuiz`: crea preguntas para un módulo concreto a partir del
 * contenido base (`generated_content.topics[i].lessons`) y, si está disponible,
 * el contenido extendido (`expanded_content.topics[i].lessons`).
 *
 * `generateFinalQuiz`: crea un examen final cubriendo todo el curso.
 *
 * Tipos de pregunta soportados: single, multi, tf, order. El tipo `image`
 * no se genera por IA (requiere assets) — se añade manualmente desde el panel.
 */

import OpenAI from 'openai';
import type {
  ExpandedCourseContent,
  ExpandedLesson,
} from '@/services/openaiEbookService';
import type {
  GeneratedCourseStructure,
  GeneratedTopic,
} from '@/types';
import { resolveAiModel } from '@/lib/aiModels';
import { logOpenAiChatUsage } from '@/services/aiUsageLogService';

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY required');
  return new OpenAI({ apiKey: key });
}

export type GeneratedQuizQuestion =
  | {
      kind: 'single';
      text: string;
      hint?: string;
      explanation?: string;
      options: { id: string; text: string }[];
      correct: string;
    }
  | {
      kind: 'multi';
      text: string;
      hint?: string;
      explanation?: string;
      options: { id: string; text: string }[];
      correct: string[];
    }
  | {
      kind: 'tf';
      text: string;
      hint?: string;
      explanation?: string;
      correct: boolean;
    }
  | {
      kind: 'order';
      text: string;
      hint?: string;
      explanation?: string;
      items: { id: string; text: string }[];
      correct_order: string[];
    };

export interface GeneratedQuiz {
  title: string;
  questions: GeneratedQuizQuestion[];
}

interface LessonSummary {
  title: string;
  bullets: string[];
}

function summarizeLesson(
  lesson: { title: string; content?: string; duration_minutes?: number },
  expanded: ExpandedLesson | null
): LessonSummary {
  const bullets: string[] = [];
  if (expanded?.keyPoints?.length) {
    bullets.push(...expanded.keyPoints.slice(0, 6));
  }
  if (expanded?.intro?.trim()) bullets.push(expanded.intro.slice(0, 300));
  if (expanded?.body?.trim()) {
    // primeras 2 frases del body
    const sentences = expanded.body.split(/(?<=[\.\!\?])\s+/).filter(Boolean).slice(0, 3);
    bullets.push(...sentences);
  }
  if (!bullets.length && lesson.content?.trim()) {
    bullets.push(lesson.content.slice(0, 400));
  }
  return { title: lesson.title, bullets: bullets.filter(Boolean) };
}

function buildTopicContext(
  topic: GeneratedTopic,
  expandedTopic: ExpandedCourseContent['topics'][number] | undefined
): { topicTitle: string; lessons: LessonSummary[] } {
  const lessons: LessonSummary[] = (topic.lessons ?? []).map((l, idx) =>
    summarizeLesson(l, expandedTopic?.lessons?.[idx] ?? null)
  );
  return { topicTitle: topic.title, lessons };
}

function buildCourseContext(
  gc: GeneratedCourseStructure,
  expanded: ExpandedCourseContent | null
): { courseTitle: string; topics: { topicTitle: string; lessons: LessonSummary[] }[] } {
  return {
    courseTitle: gc.title,
    topics: (gc.topics ?? []).map((t, i) =>
      buildTopicContext(t, expanded?.topics?.[i])
    ),
  };
}

const SYSTEM_PROMPT = `Eres un diseñador instruccional senior creando quizzes para Recursalia, una plataforma LMS gamificada en español (España y LATAM). Tu trabajo es que el alumno DISFRUTE comprobando lo que ha aprendido, no que sufra.

CALIDAD (lo más importante):
- Cada pregunta evalúa UN concepto concreto, mencionado o desarrollado en el material aportado. Nada genérico.
- Pregunta como si conversaras con un alumno motivado: directa, en segunda persona ("¿Qué elegirías cuando…?", "Tu cliente te pide…"), con micro-escenarios cuando ayude.
- Cada pregunta es autocontenida: no digas "como vimos antes" ni "según la lección 3". El alumno la lee fuera de contexto.
- Las distractoras (opciones incorrectas) deben ser plausibles para alguien que NO estudió, pero claramente descartables tras estudiar. Nada de absurdas, nada de "todas las anteriores" ni "ninguna".
- En \`single\`: 4 opciones de longitud parecida (máx. 90 chars). Solo UNA es indiscutiblemente correcta.
- **DISTRIBUCIÓN DE LA CORRECTA**: la respuesta correcta NO debe estar siempre en "a". Distribúyela uniformemente entre "a", "b", "c" y "d" a lo largo del quiz (≈25% en cada posición). Si generas 4 preguntas \`single\`, una debe tener "a" como correcta, otra "b", otra "c" y otra "d". Esto es CRÍTICO: el sistema rechaza quizzes con la correcta sesgada hacia una sola letra.
- En \`tf\`: la afirmación debe poder responderse sin matices ("depende" → no usar tf).
- En \`multi\`: 4 opciones, mínimo 2 correctas, máximo 3. Avísale en el enunciado: "Elige todas las que apliquen".
- En \`order\`: 3–5 pasos de una secuencia real (proceso, workflow, recorrido del alumno). \`correct_order\` debe ser la secuencia natural.
- \`explanation\` (obligatoria, 1 frase de 12–25 palabras): el "aha moment". Explica POR QUÉ es la correcta o el matiz que distingue. Aparece como feedback inmediato.
- \`hint\` (opcional, solo si la pregunta es difícil): pista útil sin regalar la respuesta. 1 frase.

VARIEDAD Y TONO:
- Mezcla bien los tipos pedidos (proporciones orientativas en cada prompt).
- Tono motivador y cercano, sin coloquialismos. Usa "tú" / "vosotros" (España) de forma neutra.
- A veces empieza con un escenario corto ("Estás editando el primer plano de…") para hacerla más memorable.
- Evita repetir conceptos entre preguntas del mismo quiz; cubre la mayor superficie posible del módulo.

FORMATO ESTRICTO:
- Devuelve ÚNICAMENTE JSON válido, sin Markdown, comentarios ni texto fuera del JSON.
- Los \`id\` de opciones son strings cortos: "a", "b", "c", "d". Los de \`order\`: "1","2","3"...
- No añadas claves no definidas en el esquema del prompt usuario.`;

function buildModulePrompt({
  courseTitle,
  topic,
  numQuestions,
}: {
  courseTitle: string;
  topic: { topicTitle: string; lessons: LessonSummary[] };
  numQuestions: number;
}): string {
  const lessonBlocks = topic.lessons
    .map((l, i) => `  Lección ${i + 1}: ${l.title}\n${l.bullets.map((b) => `   - ${b}`).join('\n')}`)
    .join('\n\n');

  return `Genera un quiz de comprobación para un módulo de un curso.

Curso: "${courseTitle}"
Módulo: "${topic.topicTitle}"

Contenido del módulo:
${lessonBlocks}

Genera exactamente ${numQuestions} preguntas en JSON:

{
  "title": "Quiz: <título del módulo>",
  "questions": [
    {
      "kind": "single",
      "text": "...",
      "hint": "..." (opcional),
      "explanation": "...",
      "options": [
        { "id": "a", "text": "..." },
        { "id": "b", "text": "..." },
        { "id": "c", "text": "..." },
        { "id": "d", "text": "..." }
      ],
      "correct": "a"
    },
    { "kind": "tf", "text": "...", "explanation": "...", "correct": true },
    {
      "kind": "multi",
      "text": "...",
      "explanation": "...",
      "options": [ { "id": "a", "text": "..." }, { "id": "b", "text": "..." }, { "id": "c", "text": "..." }, { "id": "d", "text": "..." } ],
      "correct": ["a", "c"]
    },
    {
      "kind": "order",
      "text": "Ordena correctamente los pasos:",
      "explanation": "...",
      "items": [ { "id": "1", "text": "Primer paso" }, { "id": "2", "text": "Segundo paso" }, { "id": "3", "text": "Tercer paso" } ],
      "correct_order": ["1", "2", "3"]
    }
  ]
}

Distribuye los tipos así (orientativo, pero al menos uno de cada cuando \`numQuestions\` lo permita):
- ~55% single
- ~20% tf
- ~15% multi
- ~10% order (idealmente 1 pregunta de ordenar cuando hay un proceso real)

Asegúrate de cubrir las DISTINTAS lecciones del módulo (no concentres todas en la primera). Empieza por una pregunta accesible (calienta motores) y termina con una más exigente.
SOLO JSON, sin comentarios.`;
}

function buildFinalSlicePrompt({
  courseTitle,
  topic,
  moduleNumber,
  totalModules,
  numQuestions,
}: {
  courseTitle: string;
  topic: { topicTitle: string; lessons: LessonSummary[] };
  moduleNumber: number;
  totalModules: number;
  numQuestions: number;
}): string {
  const lessonBlocks = topic.lessons
    .map((l, i) => `  Lección ${i + 1}: ${l.title}\n${l.bullets.map((b) => `   - ${b}`).join('\n')}`)
    .join('\n\n');

  return `Genera la PORCIÓN del EXAMEN FINAL correspondiente al módulo ${moduleNumber} de ${totalModules}.

Curso: "${courseTitle}"
Módulo ${moduleNumber}: "${topic.topicTitle}"

Contenido del módulo:
${lessonBlocks}

Genera exactamente ${numQuestions} preguntas en JSON que evalúen el dominio de ESTE módulo en el contexto de un examen final integrador. Estas preguntas:
- Son más exigentes que un quiz de módulo: distractoras más finas, matices más sutiles, sin preguntas triviales.
- Combinan conceptos teóricos con micro-escenarios prácticos.
- Distribución de tipos: ~60% single, ~20% tf, ~15% multi, ~5% order (incluye \`order\` solo si encaja con el contenido del módulo).
- NO menciones explícitamente "examen final" ni "módulo X" en el texto; cada pregunta es autocontenida.

Formato JSON estricto:
{
  "title": "Examen final · ${topic.topicTitle}",
  "questions": [ ...mismo esquema que los quizzes de módulo... ]
}

SOLO JSON, sin comentarios.`;
}

function ensureUniqueIds<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  let counter = 0;
  return items.map((it) => {
    let id = it.id?.trim() || `o${++counter}`;
    while (seen.has(id)) {
      id = `${id}_${++counter}`;
    }
    seen.add(id);
    return { ...it, id };
  });
}

/**
 * Mezcla en sitio el array (Fisher-Yates). Útil para evitar el sesgo
 * "la opción correcta es siempre la primera" tan típico en LLMs:
 * los modelos tienden a generar la correcta como `id: "a"`.
 */
function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function validateGeneratedQuiz(quiz: GeneratedQuiz): GeneratedQuiz {
  if (!quiz?.title?.trim()) throw new Error('Quiz sin título');
  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    throw new Error('Quiz sin preguntas');
  }
  const cleaned: GeneratedQuizQuestion[] = [];
  for (const raw of quiz.questions) {
    if (!raw || typeof raw !== 'object' || !('kind' in raw)) continue;
    if (!raw.text || typeof raw.text !== 'string') continue;
    if (raw.kind === 'tf') {
      if (typeof raw.correct !== 'boolean') continue;
      cleaned.push(raw);
      continue;
    }
    if (raw.kind === 'single') {
      const opts = ensureUniqueIds((raw.options ?? []) as { id: string; text: string }[]);
      if (opts.length < 2) continue;
      if (typeof raw.correct !== 'string') continue;
      if (!opts.some((o) => o.id === raw.correct)) continue;
      // Mezclamos las opciones para anular el sesgo de "la correcta es la primera".
      // `correct` referencia por id, así que sigue siendo válida tras el shuffle.
      cleaned.push({ ...raw, options: shuffleInPlace(opts.slice()) });
      continue;
    }
    if (raw.kind === 'multi') {
      const opts = ensureUniqueIds((raw.options ?? []) as { id: string; text: string }[]);
      if (opts.length < 3) continue;
      if (!Array.isArray(raw.correct) || raw.correct.length === 0) continue;
      const validCorrect = raw.correct.filter((id) => opts.some((o) => o.id === id));
      if (validCorrect.length === 0) continue;
      cleaned.push({
        ...raw,
        options: shuffleInPlace(opts.slice()),
        correct: validCorrect,
      });
      continue;
    }
    if (raw.kind === 'order') {
      const items = ensureUniqueIds((raw.items ?? []) as { id: string; text: string }[]);
      if (items.length < 3) continue;
      if (!Array.isArray(raw.correct_order) || raw.correct_order.length !== items.length) continue;
      const allKnown = raw.correct_order.every((id) => items.some((i) => i.id === id));
      if (!allKnown) continue;
      cleaned.push({ ...raw, items });
      continue;
    }
  }
  if (cleaned.length === 0) {
    throw new Error('Ninguna pregunta válida tras validar');
  }
  return { title: quiz.title.trim(), questions: cleaned };
}

async function callOpenAI({
  courseId,
  operation,
  prompt,
}: {
  courseId: string;
  operation: string;
  prompt: string;
}): Promise<GeneratedQuiz> {
  const client = getOpenAI();
  const model = resolveAiModel('quizGenerate');
  const completion = await client.chat.completions.create({
    model,
    response_format: { type: 'json_object' },
    temperature: 0.7,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  });

  logOpenAiChatUsage(operation, model, completion.usage, courseId);

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('OpenAI devolvió respuesta vacía');
  let parsed: GeneratedQuiz;
  try {
    parsed = JSON.parse(raw) as GeneratedQuiz;
  } catch {
    throw new Error('OpenAI devolvió JSON inválido');
  }
  return validateGeneratedQuiz(parsed);
}

export async function generateModuleQuiz({
  courseId,
  course,
  expanded,
  topicId,
  numQuestions = 6,
}: {
  courseId: string;
  course: GeneratedCourseStructure;
  expanded: ExpandedCourseContent | null;
  topicId: string;
  numQuestions?: number;
}): Promise<GeneratedQuiz> {
  const idx = (course.topics ?? []).findIndex((t) => t.id === topicId);
  if (idx < 0) throw new Error('Topic no encontrado en el curso');
  const topic = course.topics[idx];
  const ctx = buildTopicContext(topic, expanded?.topics?.[idx]);
  const prompt = buildModulePrompt({
    courseTitle: course.title,
    topic: ctx,
    numQuestions,
  });
  return callOpenAI({
    courseId,
    operation: 'quiz.module.generate',
    prompt,
  });
}

/**
 * Genera el EXAMEN FINAL como combinación de "slices" por módulo.
 *
 * En lugar de pedirle al modelo N preguntas para todo el curso (donde tiende
 * a concentrarse en 1-2 módulos), pedimos una porción equilibrada por
 * cada módulo y las combinamos. Garantizamos así:
 *  - Cobertura matemática de TODOS los módulos.
 *  - Robustez ante fallos parciales: si un módulo falla, seguimos con los
 *    demás y devolvemos lo que tengamos (siempre que haya al menos 1 pregunta
 *    por al menos la mitad de los módulos).
 *
 * El número de preguntas final puede diferir ligeramente del solicitado por
 * efectos de redondeo o de validación. Garantizamos como mínimo `topics.length`
 * preguntas (1 por módulo) si el reparto resulta menor.
 */
export async function generateFinalQuiz({
  courseId,
  course,
  expanded,
  numQuestions = 12,
}: {
  courseId: string;
  course: GeneratedCourseStructure;
  expanded: ExpandedCourseContent | null;
  numQuestions?: number;
}): Promise<GeneratedQuiz> {
  const topics = (course.topics ?? []).filter(
    (t) => Array.isArray(t.lessons) && t.lessons.length > 0
  );
  if (topics.length === 0) {
    throw new Error('Curso sin módulos válidos para examen final');
  }

  // Asegurar al menos 1 pregunta por módulo, aunque el alumno pida pocas.
  const effectiveTotal = Math.max(numQuestions, topics.length);

  // Reparto equilibrado: los primeros `remainder` módulos llevan una pregunta extra.
  const baseQ = Math.floor(effectiveTotal / topics.length);
  const remainder = effectiveTotal - baseQ * topics.length;
  const perModule = topics.map((_, i) => baseQ + (i < remainder ? 1 : 0));

  const courseTitle = course.title;
  const allQuestions: GeneratedQuizQuestion[] = [];
  const errors: string[] = [];

  // Secuencial para no abusar de OpenAI ni saturar nuestros límites.
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const numQ = perModule[i];
    if (numQ <= 0) continue;
    try {
      const ctxTopic = buildTopicContext(topic, expanded?.topics?.[i]);
      const prompt = buildFinalSlicePrompt({
        courseTitle,
        topic: ctxTopic,
        moduleNumber: i + 1,
        totalModules: topics.length,
        numQuestions: numQ,
      });
      const slice = await callOpenAI({
        courseId,
        operation: `quiz.final.slice.${i + 1}`,
        prompt,
      });
      allQuestions.push(...slice.questions);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Módulo ${i + 1}: ${msg.slice(0, 160)}`);
      // Continuamos con el resto: queremos un examen incluso si algún módulo falla.
    }
  }

  if (allQuestions.length === 0) {
    throw new Error(
      `Examen final: ningún módulo generó preguntas. ${errors.join(' | ').slice(0, 400)}`
    );
  }

  // Mezclamos para que las preguntas no aparezcan agrupadas por módulo.
  shuffleInPlace(allQuestions);

  // Si el reparto produjo más preguntas que las solicitadas (por mínimo de
  // 1/módulo), las conservamos: un examen ligeramente más largo es preferible
  // a sacrificar cobertura.
  return {
    title: `Examen final · ${courseTitle}`,
    questions: allQuestions,
  };
}

/**
 * Convierte una `GeneratedQuizQuestion` en filas listas para insertar en
 * `quiz_questions`. Devuelve un array porque conserva el orden.
 */
export function questionsToRows(
  quizId: string,
  questions: GeneratedQuizQuestion[]
): Array<{
  quiz_id: string;
  position: number;
  kind: 'single' | 'multi' | 'tf' | 'image' | 'order';
  text: string;
  hint: string | null;
  explanation: string | null;
  payload: Record<string, unknown>;
}> {
  return questions.map((q, position) => {
    if (q.kind === 'tf') {
      return {
        quiz_id: quizId,
        position,
        kind: 'tf',
        text: q.text,
        hint: q.hint ?? null,
        explanation: q.explanation ?? null,
        payload: { correct: q.correct },
      };
    }
    if (q.kind === 'single') {
      return {
        quiz_id: quizId,
        position,
        kind: 'single',
        text: q.text,
        hint: q.hint ?? null,
        explanation: q.explanation ?? null,
        payload: { options: q.options, correct: q.correct },
      };
    }
    if (q.kind === 'multi') {
      return {
        quiz_id: quizId,
        position,
        kind: 'multi',
        text: q.text,
        hint: q.hint ?? null,
        explanation: q.explanation ?? null,
        payload: { options: q.options, correct: q.correct },
      };
    }
    // order
    return {
      quiz_id: quizId,
      position,
      kind: 'order',
      text: q.text,
      hint: q.hint ?? null,
      explanation: q.explanation ?? null,
      payload: { items: q.items, correct_order: q.correct_order },
    };
  });
}
