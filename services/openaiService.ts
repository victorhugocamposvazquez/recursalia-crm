import OpenAI from 'openai';
import type { CourseInputPayload, GeneratedCourseStructure } from '@/types';

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY required');
  return new OpenAI({ apiKey: key });
}

function buildPrompt(payload: CourseInputPayload): string {
  return `Genera la estructura JSON completa de un curso online para recursalia.com con estos datos:
- Tema: ${payload.topic}
- Nivel: ${payload.level}
- Avatar/Persona objetivo: ${payload.avatar}
- Enfoque: ${payload.focus}

Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta (sin markdown ni texto adicional):

{
  "title": "Título del curso",
  "description": "Descripción larga HTML (2-3 párrafos) con emojis cuando convenga",
  "short_description": "Tagline corta para conversión, 1-2 oraciones con emoji",
  "benefits": [
    {"icon": "€", "title": "Genera ingresos rápido", "description": "Frase corta del beneficio"},
    {"icon": "💼", "title": "Accede a oportunidades", "description": "Frase corta"},
    {"icon": "📈", "title": "Relación calidad/precio", "description": "Frase corta"},
    {"icon": "🎓", "title": "Diploma certificado", "description": "Frase corta"}
  ],
  "highlight": "Frase impactante tipo: El salario medio de un profesional en [ámbito] es de X$",
  "price_original": 180,
  "price_sale": 75,
  "badge": "Best Seller",
  "access_level": "Todos los niveles",
  "certificate": true,
  "job_bank": true,
  "language": "Español",
  "author_name": "John Alex",
  "author_bio": "Biografía corta del autor (1-2 oraciones)",
  "topics": [
    {
      "title": "🧘‍♀️ Módulo 1: [Nombre con emoji]",
      "lessons": [
        {"title": "Título lección", "content": "Contenido HTML (2-4 párrafos con p, ul, li)", "duration_minutes": 15},
        {"title": "Título lección", "content": "Contenido HTML", "duration_minutes": 15},
        {"title": "Título lección", "content": "Contenido HTML", "duration_minutes": 15},
        {"title": "Título lección", "content": "Contenido HTML", "duration_minutes": 15}
      ]
    }
  ],
  "total_duration_minutes": 360
}

REGLAS:
- Exactamente 6 módulos, 4 lecciones por módulo (24 lecciones totales).
- Cada módulo debe tener emoji en el título (ej: 🧘‍♀️ Módulo 1: Fundamentos).
- benefits: exactamente 4 elementos con iconos variados.
- Contenido HTML semántico (p, h3, ul, li). Sin markdown.`;
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
          'Eres un experto en crear cursos online para recursalia.com. Responde solo con JSON válido. Usa emojis en títulos y descripciones.',
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
