/**
 * Construye un **plan editorial** completo del curso en una sola llamada al
 * modelo. Sirve para que cada lección se expanda con coherencia:
 *  - Cada lección sabe qué conceptos introduce y cuáles asume del módulo previo.
 *  - El modelo no redefine cosas ya cubiertas.
 *  - Hay objetivos de aprendizaje por módulo y por lección.
 *  - Se sugieren ejemplos / ejercicios concretos.
 */

import OpenAI from 'openai';
import type { GeneratedCourseStructure } from '@/types';
import { resolveAiModel } from '@/lib/aiModels';
import { logOpenAiChatUsage } from '@/services/aiUsageLogService';

export interface LessonPlan {
  /** 0-indexed dentro del módulo. */
  index: number;
  /** Título original tal y como vino del outline (para mapear). */
  title: string;
  /** Resultado de aprendizaje específico de la lección (1 frase). */
  intent: string;
  /** 2-4 conceptos clave que se trabajan aquí. */
  keyConcepts: string[];
  /** Conceptos ya cubiertos antes y que NO deben volver a definirse. */
  assumesKnown: string[];
  /** Sugerencia de ejemplo concreto (1-2 frases). */
  suggestedExample: string;
  /** Sugerencia de ejercicio o aplicación práctica (1-2 frases). */
  suggestedExercise: string;
}

export interface ModulePlan {
  /** 0-indexed. */
  index: number;
  title: string;
  /** Resumen del módulo en 1-2 frases. */
  summary: string;
  /** 2-4 objetivos de aprendizaje del módulo. */
  objectives: string[];
  /** Conceptos que se introducen aquí por primera vez. */
  definesHere: string[];
  /** Qué se queda fuera (se cubre en módulos posteriores). */
  leavesForLater: string[];
  lessons: LessonPlan[];
}

export interface EditorialPlan {
  /** 3-5 outcomes globales del curso. */
  globalObjectives: string[];
  /** A quién va dirigido el curso, en 1 frase. */
  targetReader: string;
  /** Términos del glosario candidato (extraídos por el modelo). */
  glossaryCandidates: string[];
  modules: ModulePlan[];
}

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY required');
  return new OpenAI({ apiKey: key });
}

function buildPrompt(content: GeneratedCourseStructure): string {
  const topics = (content.topics ?? []).map((t, i) => ({
    i,
    title: t.title,
    lessons: t.lessons.map((l, j) => ({ j, title: l.title })),
  }));

  return `Eres un editor pedagógico senior. Te paso el OUTLINE de un curso y debes diseñar el PLAN EDITORIAL para que cada lección se redacte con coherencia, sin repetir definiciones y con una progresión real.

OUTLINE:
Título: ${content.title}
Descripción corta: ${content.short_description}
Descripción larga (HTML): ${(content.description ?? '').replace(/<[^>]*>/g, ' ').slice(0, 800)}

Módulos:
${topics.map((t) => `- Módulo ${t.i + 1}: ${t.title}\n${t.lessons.map((l) => `  · Lección ${t.i + 1}.${l.j + 1}: ${l.title}`).join('\n')}`).join('\n')}

DEVUELVE ÚNICAMENTE un JSON válido (sin markdown) con esta forma exacta:
{
  "globalObjectives": ["string", "..."],
  "targetReader": "string",
  "glossaryCandidates": ["string", "..."],
  "modules": [
    {
      "index": 0,
      "title": "string",
      "summary": "string (1-2 frases)",
      "objectives": ["string", "..."],
      "definesHere": ["concepto", "..."],
      "leavesForLater": ["concepto", "..."],
      "lessons": [
        {
          "index": 0,
          "title": "string",
          "intent": "string (resultado concreto de la lección, 1 frase)",
          "keyConcepts": ["concepto", "..."],
          "assumesKnown": ["concepto previo", "..."],
          "suggestedExample": "string (1-2 frases con ejemplo aterrizado)",
          "suggestedExercise": "string (1-2 frases con un ejercicio aplicado)"
        }
      ]
    }
  ]
}

REGLAS:
1. Respeta exactamente el número y orden de módulos y lecciones del outline.
2. "assumesKnown" en la lección N debe usar SOLO conceptos definidos en lecciones anteriores del MISMO módulo o en módulos previos.
3. Una vez un concepto aparece en "definesHere" o "keyConcepts", NO debe volver a aparecer como "definesHere" en módulos posteriores (solo como "assumesKnown" si hace falta).
4. "globalObjectives": 3-5 frases con outcomes accionables ("Al final del curso, el alumno será capaz de ...").
5. "glossaryCandidates": 8-20 términos centrales del curso (no muletillas).
6. No uses emojis ni markdown. Idioma: castellano.`;
}

export async function buildEditorialPlan(
  content: GeneratedCourseStructure,
  courseId?: string | null
): Promise<EditorialPlan> {
  const openai = getOpenAI();
  const model = resolveAiModel('editorialPlan');

  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'Eres un editor pedagógico experto en cursos online. Devuelves SOLO JSON válido, sin texto adicional, sin markdown.',
      },
      { role: 'user', content: buildPrompt(content) },
    ],
    temperature: 0.5,
    response_format: { type: 'json_object' },
  });

  logOpenAiChatUsage('editorial_plan', model, response.usage, courseId, {
    modules: content.topics?.length ?? 0,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? '';
  if (!raw) throw new Error('OpenAI editorial plan: empty response');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `OpenAI editorial plan: invalid JSON (${err instanceof Error ? err.message : String(err)})`
    );
  }

  return normalizePlan(parsed, content);
}

function normalizePlan(
  parsed: unknown,
  content: GeneratedCourseStructure
): EditorialPlan {
  const obj = (typeof parsed === 'object' && parsed !== null
    ? (parsed as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  const expectedModules = content.topics ?? [];

  const modules: ModulePlan[] = expectedModules.map((topic, ti) => {
    const m = findModule(obj.modules, ti, topic.title);
    const lessonsExpected = topic.lessons;

    const lessons: LessonPlan[] = lessonsExpected.map((lesson, lj) => {
      const lp = findLesson(m?.lessons, lj, lesson.title);
      return {
        index: lj,
        title: lesson.title,
        intent: pickString(lp?.intent, lesson.title),
        keyConcepts: pickStringArray(lp?.keyConcepts).slice(0, 6),
        assumesKnown: pickStringArray(lp?.assumesKnown).slice(0, 6),
        suggestedExample: pickString(lp?.suggestedExample, ''),
        suggestedExercise: pickString(lp?.suggestedExercise, ''),
      };
    });

    return {
      index: ti,
      title: topic.title,
      summary: pickString(m?.summary, ''),
      objectives: pickStringArray(m?.objectives).slice(0, 6),
      definesHere: pickStringArray(m?.definesHere).slice(0, 12),
      leavesForLater: pickStringArray(m?.leavesForLater).slice(0, 12),
      lessons,
    };
  });

  return {
    globalObjectives: pickStringArray(obj.globalObjectives).slice(0, 6),
    targetReader: pickString(obj.targetReader, ''),
    glossaryCandidates: pickStringArray(obj.glossaryCandidates).slice(0, 30),
    modules,
  };
}

function findModule(
  raw: unknown,
  expectedIndex: number,
  expectedTitle: string
): { lessons?: unknown; [k: string]: unknown } | null {
  if (!Array.isArray(raw)) return null;
  const byIndex = raw[expectedIndex];
  if (isObj(byIndex)) return byIndex;
  const byTitle = raw.find(
    (it) => isObj(it) && norm(it.title) === norm(expectedTitle)
  );
  return isObj(byTitle) ? byTitle : null;
}

function findLesson(
  raw: unknown,
  expectedIndex: number,
  expectedTitle: string
): Record<string, unknown> | null {
  if (!Array.isArray(raw)) return null;
  const byIndex = raw[expectedIndex];
  if (isObj(byIndex)) return byIndex;
  const byTitle = raw.find(
    (it) => isObj(it) && norm(it.title) === norm(expectedTitle)
  );
  return isObj(byTitle) ? byTitle : null;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function pickString(v: unknown, fallback: string): string {
  if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  return fallback;
}

function pickStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map((x) => x.trim());
}

function norm(s: unknown): string {
  return typeof s === 'string' ? s.trim().toLowerCase() : '';
}
