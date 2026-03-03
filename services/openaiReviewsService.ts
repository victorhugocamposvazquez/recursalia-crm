import OpenAI from 'openai';
import type { GeneratedReview } from '@/types';

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY required');
  return new OpenAI({ apiKey: key });
}

const BATCH_SIZE = 25;

const DEFAULT_PROMPT = `REGLAS:
- title: Corto y natural, como lo escribiria un alumno normal (max 60 chars). Ejemplos: "Muy util", "Me ha encantado", "Justo lo que buscaba", "Mejor de lo que esperaba".
- content: 1-3 oraciones en tono coloquial, como si lo escribiera alguien real despues de hacer el curso. Usa lenguaje informal, cercano, con expresiones naturales. Algunos pueden tener faltas leves o frases cortas. Evita un tono corporativo o demasiado perfecto.
- rating: Mayoria 4-5, algunas 3 para credibilidad.
- author_name: Nombres espanoles y latinoamericanos realistas y variados (hombres y mujeres).
- date: Fechas variadas en los ultimos 6 meses (formato YYYY-MM-DD).
- Variedad: no repitas estructuras, algunos cortos ("Genial, muy recomendable"), otros mas detallados. Mezcla opiniones sobre el contenido, el profesor, la relacion calidad-precio, lo practico, etc.
- Sin emojis.`;

function buildReviewsPrompt(
  courseTitle: string,
  count: number,
  customPrompt?: string
): string {
  const base = `Genera ${count} reseñas de estudiantes para el curso "${courseTitle}".

Devuelve ÚNICAMENTE un JSON array (sin markdown):
[
  {
    "title": "Ideal para mejorar en...",
    "content": "Comentario de 1-2 oraciones sobre el curso",
    "rating": 5,
    "author_name": "Nombre Apellido",
    "date": "2024-08-23"
  }
]
`;
  return customPrompt?.trim()
    ? `${base}\n\nINSTRUCCIONES ADICIONALES:\n${customPrompt}`
    : `${base}\n\n${DEFAULT_PROMPT}`;
}

export async function generateReviews(
  courseTitle: string,
  totalCount: number = 50,
  customPrompt?: string
): Promise<GeneratedReview[]> {
  const allReviews: GeneratedReview[] = [];

  for (let offset = 0; offset < totalCount; offset += BATCH_SIZE) {
    const count = Math.min(BATCH_SIZE, totalCount - offset);
    const prompt = buildReviewsPrompt(courseTitle, count, customPrompt);

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Genera resenas de alumnos reales para cursos online. Las resenas deben sonar naturales y coloquiales, como las que dejaria una persona normal en internet. Nada de tono profesional ni corporativo. Responde solo con JSON array valido. Sin emojis.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) continue;

    const cleaned = raw.replace(/^```json\s*|\s*```$/g, '').trim();
    try {
      const batch = JSON.parse(cleaned) as GeneratedReview[];
      if (Array.isArray(batch)) {
        const valid = batch.filter(
          (r) =>
            r.title &&
            r.rating >= 1 &&
            r.rating <= 5 &&
            r.author_name &&
            r.date
        );
        allReviews.push(...valid);
      }
    } catch {
      // Skip invalid batch
    }
  }

  return allReviews;
}
