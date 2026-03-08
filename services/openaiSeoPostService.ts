import OpenAI from 'openai';
import type { SeoPostType, GeneratedSeoPost } from '@/types';

const CONCURRENCY = 3;

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY required');
  return new OpenAI({ apiKey: key });
}

interface PostSpec {
  type: SeoPostType;
  promptHint: string;
}

function getPostSpecs(courseTopic: string): PostSpec[] {
  return [
    // Introduccion (top-of-funnel, maximo volumen)
    { type: 'intro', promptHint: `Articulo introductorio: "Que es ${courseTopic} y para que sirve". Explica el concepto de forma clara, que aplicaciones tiene, por que es importante aprenderlo hoy y a quien le conviene. Tono divulgativo y accesible.` },

    // Tutoriales (4)
    { type: 'tutorial', promptHint: `Tutorial paso a paso: "Como aprender ${courseTopic} desde cero". Guia practica para principiantes.` },
    { type: 'tutorial', promptHint: `Tutorial intermedio: "Guia practica de ${courseTopic}: de la teoria a la accion". Enfoque hands-on con ejemplos reales.` },
    { type: 'tutorial', promptHint: `Tutorial avanzado: "Tecnicas avanzadas de ${courseTopic} que pocos conocen". Tips de experto para destacar.` },
    { type: 'tutorial', promptHint: `Tutorial herramientas: "Las mejores herramientas y recursos para ${courseTopic}". Listado practico con pros y contras.` },

    // Listicles (2)
    { type: 'listicle', promptHint: `Listicle errores: "7 errores comunes al aprender ${courseTopic} y como evitarlos". Tono directo y util.` },
    { type: 'listicle', promptHint: `Listicle consejos: "10 consejos de expertos para dominar ${courseTopic}". Tips accionables y concretos.` },

    // Carrera y salarios por pais (3)
    { type: 'career', promptHint: `Salarios Mexico: "Cuanto gana un profesional de ${courseTopic} en Mexico en 2026". Datos de salarios por ciudad (CDMX, Guadalajara, Monterrey), sectores que contratan, perspectivas de crecimiento. Incluye rangos salariales en pesos mexicanos (MXN).` },
    { type: 'career', promptHint: `Salarios Colombia: "Cuanto gana un profesional de ${courseTopic} en Colombia en 2026". Datos de salarios por ciudad (Bogota, Medellin, Cali), empresas que buscan estos perfiles. Incluye rangos en pesos colombianos (COP).` },
    { type: 'career', promptHint: `Salida laboral: "Como conseguir tu primer trabajo en ${courseTopic}". Guia con pasos concretos, portfolio, plataformas de empleo y tips para entrevistas.` },

    // Comparativas (2)
    { type: 'comparison', promptHint: `Comparativa aprendizaje: "Aprender ${courseTopic} por tu cuenta vs con un curso online: que es mejor". Analisis honesto con pros y contras.` },
    { type: 'comparison', promptHint: `Comparativa tendencias: elige dos enfoques o ramas importantes de ${courseTopic} y haz una comparativa detallada para ayudar al lector a elegir.` },

    // Certificaciones (intencion transaccional directa)
    { type: 'certification', promptHint: `Certificaciones: "Mejores certificaciones y cursos de ${courseTopic} en 2026". Analiza las opciones disponibles (presenciales, online, universitarias, privadas), compara precios, duracion y reconocimiento. Recomienda el curso de Recursalia como opcion destacada por relacion calidad-precio.` },

    // Geolocalizados (3 paises con alta demanda)
    { type: 'geo', promptHint: `Post geolocalizado Mexico: "Mejores cursos de ${courseTopic} online en Mexico 2026". Analiza opciones disponibles para mexicanos, menciona precios en pesos mexicanos, plataformas populares en Mexico, y por que un curso online es la mejor opcion. Posiciona el curso de Recursalia como la mejor alternativa.` },
    { type: 'geo', promptHint: `Post geolocalizado Colombia: "Donde estudiar ${courseTopic} online en Colombia 2026". Opciones para colombianos, precios en pesos colombianos, comparativa con universidades locales, ventajas del formato online. Recomienda el curso de Recursalia.` },
    { type: 'geo', promptHint: `Post geolocalizado Argentina: "Cursos de ${courseTopic} online en Argentina 2026: guia completa". Opciones para argentinos, contexto economico (precios en dolares y pesos argentinos), plataformas disponibles, becas o descuentos. Destaca el curso de Recursalia.` },

    // Guia definitiva y opinion
    { type: 'ultimate_guide', promptHint: `Guia definitiva: "Todo lo que necesitas saber para ser profesional de ${courseTopic} en 2026". Post largo y completo que cubra formacion, herramientas, mercado laboral y recursos.` },
    { type: 'review', promptHint: `Opinion experta: "Merece la pena estudiar ${courseTopic} online en 2026". Analisis honesto de ventajas, desventajas, expectativas realistas y para quien es.` },
  ];
}

function buildPostPrompt(
  spec: PostSpec,
  courseTopic: string,
  courseTitle: string,
  courseUrl: string,
): string {
  return `Genera un post de blog SEO para recursalia.com sobre el tema "${courseTopic}".

INDICACION DEL POST:
${spec.promptHint}

DATOS DEL CURSO RELACIONADO:
- Titulo: ${courseTitle}
- URL: ${courseUrl}

Devuelve UNICAMENTE un JSON valido (sin markdown ni texto adicional) con esta estructura:

{
  "title": "Titulo SEO del post (maximo 60 caracteres, con keyword principal)",
  "slug": "slug-seo-optimizado-sin-stopwords",
  "meta_description": "Meta description de 150-155 caracteres con keyword y call to action",
  "content": "Contenido completo en HTML semantico",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

REGLAS OBLIGATORIAS:
1. "content" debe tener entre 1200 y 1800 palabras.
2. Usar HTML semantico: h2, h3, p, ul, li, strong. NO usar h1 (WordPress lo pone).
3. Incluir entre 4-6 subtitulos h2 con keywords secundarias.
4. Escribir en espanol neutro (usar "tu", evitar "vosotros" y "vos", vocabulario universal).
5. Tono profesional pero cercano. Sin emojis en el texto.
6. Incluir AL FINAL del contenido un parrafo CTA con enlace al curso: <p><strong>Si quieres dominar ${courseTopic}, te recomendamos el <a href="${courseUrl}">${courseTitle}</a> en Recursalia.</strong></p>
7. Incluir tambien 1-2 menciones naturales al curso dentro del texto (no forzadas).
8. "tags" debe incluir 5 tags relevantes para SEO (en minusculas, sin tildes).
9. "slug" en minusculas, sin tildes, separado por guiones, maximo 6 palabras.
10. NO incluir fecha en el titulo. NO usar "Descubre" ni "En este articulo".
11. Orientado a Latinoamerica y Espana.`;
}

export type SeoProgressCallback = (
  current: number,
  total: number,
  postTitle: string,
) => void;

export async function generateSeoPosts(
  courseTopic: string,
  courseTitle: string,
  courseUrl: string,
  onProgress?: SeoProgressCallback,
): Promise<GeneratedSeoPost[]> {
  const openai = getOpenAI();
  const specs = getPostSpecs(courseTopic);
  const total = specs.length;
  const results: (GeneratedSeoPost | null)[] = new Array(total).fill(null);
  let completed = 0;

  async function generateOne(index: number) {
    const spec = specs[index];
    const prompt = buildPostPrompt(spec, courseTopic, courseTitle, courseUrl);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Eres un experto en SEO y marketing de contenidos para cursos online en espanol. Escribes posts de blog optimizados para posicionamiento en buscadores. Responde SOLO con JSON valido.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error(`OpenAI empty response for post ${index}`);

    const cleaned = raw.replace(/^```json\s*|\s*```$/g, '').trim();
    const parsed = JSON.parse(cleaned) as Omit<GeneratedSeoPost, 'post_type'>;

    if (!parsed.title || !parsed.content) {
      throw new Error(`Invalid post structure for index ${index}`);
    }

    const post: GeneratedSeoPost = {
      ...parsed,
      post_type: spec.type,
      slug: parsed.slug
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80),
    };

    results[index] = post;
    completed++;
    onProgress?.(completed, total, post.title);
  }

  const pending = specs.map((_, i) => i);
  const active: Promise<void>[] = [];

  while (pending.length > 0 || active.length > 0) {
    while (active.length < CONCURRENCY && pending.length > 0) {
      const idx = pending.shift()!;
      const p = generateOne(idx).then(() => {
        active.splice(active.indexOf(p), 1);
      });
      active.push(p);
    }
    if (active.length > 0) {
      await Promise.race(active);
    }
  }

  return results.filter((r): r is GeneratedSeoPost => r !== null);
}
