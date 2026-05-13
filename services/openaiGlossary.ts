/**
 * Genera el **glosario** del curso en una única llamada al modelo.
 *
 * Entrada: lista de `glossaryCandidates` (extraídos por el plan editorial),
 * más el título y descripción corta para anclar el dominio. Salida: una lista
 * de `{ term, definition }` lista para imprimir como anexo del PDF.
 *
 * Coste estimado: ~1k tokens entrada + ~600 tokens salida con gpt-4.1-mini.
 */

import OpenAI from 'openai';
import { resolveAiModel } from '@/lib/aiModels';
import { logOpenAiChatUsage } from '@/services/aiUsageLogService';
import type { GlossaryEntry } from '@/services/openaiEbookService';

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY required');
  return new OpenAI({ apiKey: key });
}

interface BuildGlossaryArgs {
  courseTitle: string;
  courseShortDesc: string;
  candidates: string[];
  courseId?: string | null;
}

export async function buildGlossary({
  courseTitle,
  courseShortDesc,
  candidates,
  courseId,
}: BuildGlossaryArgs): Promise<GlossaryEntry[]> {
  const cleaned = Array.from(
    new Set(
      candidates
        .map((c) => (typeof c === 'string' ? c.trim() : ''))
        .filter((c) => c.length > 0 && c.length < 80)
    )
  ).slice(0, 24);

  if (cleaned.length === 0) return [];

  const openai = getOpenAI();
  const model = resolveAiModel('glossary');

  const prompt = `Te paso un curso y una lista de TÉRMINOS candidatos para el glosario final del manual. Tu tarea es devolver una definición concisa y profesional para cada uno, ordenados alfabéticamente.

CURSO:
- Título: ${courseTitle}
- Descripción: ${courseShortDesc}

TÉRMINOS:
${cleaned.map((t, i) => `${i + 1}. ${t}`).join('\n')}

DEVUELVE únicamente JSON válido con esta forma:
{
  "entries": [
    { "term": "string (idéntico al de la lista)", "definition": "string (1-3 frases, claras, sin emojis ni markdown)" }
  ]
}

REGLAS:
1. Una entrada por término. No inventes términos nuevos.
2. Si un término está mal escrito o es una muletilla irrelevante, omítelo del JSON.
3. Las definiciones deben estar en castellano, ser autocontenidas (sin referencias a "como vimos en la lección X") y ancladas al dominio del curso.
4. Ordena las entradas alfabéticamente por "term".
5. Sin emojis. Sin markdown. Sin comillas tipográficas si rompen el JSON.`;

  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'Eres un editor pedagógico que redacta glosarios claros y precisos. Devuelves SOLO JSON válido, sin texto adicional.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  logOpenAiChatUsage('glossary', model, response.usage, courseId, {
    terms: cleaned.length,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? '';
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const entriesRaw =
    parsed && typeof parsed === 'object' && 'entries' in parsed
      ? (parsed as { entries?: unknown }).entries
      : undefined;
  if (!Array.isArray(entriesRaw)) return [];

  return entriesRaw
    .map((e): GlossaryEntry | null => {
      if (!e || typeof e !== 'object') return null;
      const obj = e as Record<string, unknown>;
      const term = typeof obj.term === 'string' ? obj.term.trim() : '';
      const definition =
        typeof obj.definition === 'string' ? obj.definition.trim() : '';
      if (!term || !definition) return null;
      return { term, definition };
    })
    .filter((x): x is GlossaryEntry => x !== null)
    .sort((a, b) => a.term.localeCompare(b.term, 'es', { sensitivity: 'base' }));
}
