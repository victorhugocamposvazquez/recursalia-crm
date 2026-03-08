import OpenAI from 'openai';
import type { CourseInputPayload, GeneratedCourseStructure } from '@/types';

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY required');
  return new OpenAI({ apiKey: key });
}

function buildPrompt(payload: CourseInputPayload): string {
  const topicsCount = payload.topicsCount ?? 6;
  const lessonsPerTopic = payload.lessonsPerTopic ?? 4;
  const totalLessons = topicsCount * lessonsPerTopic;

  return `Genera la estructura JSON completa de un curso online para recursalia.com con estos datos:
- Tema: ${payload.topic}
- Nivel: ${payload.level}
- Avatar/Persona objetivo: ${payload.avatar}
- Enfoque: ${payload.focus}
- Estructura: ${topicsCount} modulos con ${lessonsPerTopic} lecciones cada uno (${totalLessons} lecciones totales)

Devuelve UNICAMENTE un JSON valido con esta estructura exacta (sin markdown ni texto adicional):

{
  "title": "Curso de [tema] [nivel si aplica]",
  "description": "Descripcion larga HTML (2-3 parrafos con <p>, <ul>, <li>). Describe que aprendera el alumno, para quien es el curso y que resultados obtendra. SIN emojis.",
  "short_description": "Descripcion corta de 2-3 oraciones que resuma el curso para captar la atencion del comprador. Minimo 120 caracteres. SIN emojis.",
  "benefits": [
    {"icon": "€", "title": "Genera ingresos rapido", "description": "Frase corta del beneficio"},
    {"icon": "📈", "title": "Crece profesionalmente", "description": "Frase corta"},
    {"icon": "🎯", "title": "Aprende con practica", "description": "Frase corta"},
    {"icon": "🎓", "title": "Diploma certificado", "description": "Frase corta"}
  ],
  "highlight": "El salario medio de un profesional en ${payload.topic} es de X$",
  "price_original": 180,
  "price_sale": 75,
  "badge": "Best Seller",
  "access_level": "Todos los niveles",
  "certificate": true,
  "job_bank": true,
  "language": "Espanol",
  "author_name": "John Alex",
  "author_bio": "Biografia corta del autor (1-2 oraciones)",
  "topics": [
    {
      "title": "Modulo 1: [Nombre del modulo]",
      "lessons": [
        {"title": "Titulo leccion descriptivo", "content": "Contenido HTML (2-4 parrafos con p, ul, li)", "duration_minutes": 15}
      ]
    }
  ],
  "total_duration_minutes": 360
}

REGLAS OBLIGATORIAS:
1. El "title" del curso NO debe contener emojis. Solo texto limpio. Ejemplo correcto: "Curso de Fotografia Intermedia: Captura el Mundo". Ejemplo incorrecto: "📷 Curso de Fotografia".
2. La "description" y "short_description" NO deben contener emojis. Solo HTML limpio.
3. El "highlight" DEBE referirse al tema "${payload.topic}" especificamente. No uses otro tema distinto. Formato: "El salario medio de un profesional en [tema exacto del curso] es de X$".
4. "badge" SIEMPRE debe ser "Best Seller".
5. "benefits" SIEMPRE exactamente 4 elementos con iconos variados.
6. "short_description" debe tener MINIMO 120 caracteres. Es clave para la venta.
7. Exactamente ${topicsCount} modulos, ${lessonsPerTopic} lecciones por modulo (${totalLessons} lecciones totales).
8. Titulos de modulos: "Modulo 1: [Nombre]", "Modulo 2: [Nombre]", etc. Sin emojis.
9. Titulos de lecciones: descriptivos y concisos, sin emojis.
10. Contenido de lecciones: HTML semantico (p, h3, ul, li). 2-4 parrafos. Sin markdown.
11. Precios: price_original entre 120-250, price_sale entre 45-99. Numeros enteros.
12. "certificate": siempre true.
13. "job_bank": siempre true.`;
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
          'Eres un experto en crear cursos online para recursalia.com. Responde SOLO con JSON valido. NUNCA uses emojis en el titulo del curso ni en las descripciones. Los emojis SOLO se permiten en los iconos de benefits.',
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

  // Sanitizar: quitar emojis del título por si OpenAI los incluye igualmente
  // eslint-disable-next-line no-control-regex
  parsed.title = parsed.title.replace(/[^\x00-\x7F\xA0-\xFF]/g, '').trim();

  if (!parsed.badge) parsed.badge = 'Best Seller';
  if (!parsed.certificate) parsed.certificate = true;
  if (!parsed.job_bank) parsed.job_bank = true;

  if (!parsed.short_description || parsed.short_description.length < 50) {
    parsed.short_description = parsed.description
      ?.replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .slice(0, 300)
      .trim() ?? parsed.title;
  }

  return parsed;
}
