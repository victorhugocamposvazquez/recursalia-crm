import OpenAI from 'openai';
import type { CourseInputPayload, GeneratedCourseStructure } from '@/types';

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY required');
  return new OpenAI({ apiKey: key });
}

function buildPrompt(payload: CourseInputPayload): string {
  return `Genera la estructura JSON completa de un curso online con estos datos:
- Tema: ${payload.topic}
- Nivel: ${payload.level}
- Avatar/Persona objetivo: ${payload.avatar}
- Enfoque: ${payload.focus}

Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta (sin markdown ni texto adicional):
{
  "title": "Título del curso",
  "description": "Descripción larga HTML del curso (2-3 párrafos)",
  "short_description": "Descripción breve de 1-2 oraciones",
  "topics": [
    {
      "title": "Nombre del módulo/tema",
      "lessons": [
        {
          "title": "Título de la lección",
          "content": "Contenido HTML completo de la lección",
          "duration_minutes": 15
        }
      ]
    }
  ],
  "total_duration_minutes": 120
}

Incluye al menos 3 temas con 2-4 lecciones cada uno. El contenido debe ser HTML semántico (p, h2, h3, ul, li, etc).`;
}

export async function generateCourseStructure(
  payload: CourseInputPayload
): Promise<GeneratedCourseStructure> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'Eres un experto en crear estructuras de cursos online. Responde solo con JSON válido.',
      },
      { role: 'user', content: buildPrompt(payload) },
    ],
    temperature: 0.7,
  });

  const raw = response.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error('OpenAI returned empty response');

  const cleaned = raw.replace(/^```json\s*|\s*```$/g, '').trim();
  const parsed = JSON.parse(cleaned) as GeneratedCourseStructure;

  if (!parsed.title || !parsed.topics?.length) {
    throw new Error('Invalid course structure from OpenAI');
  }

  return parsed;
}
