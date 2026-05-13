/**
 * Script local de verificación: genera un PDF de muestra con contenido sample
 * para inspeccionar el nuevo diseño (Hito 2). No se usa en runtime.
 *
 *   npx tsx scripts/devGeneratePdfSample.ts
 *
 * Salida: `scripts/.out/sample.pdf`
 */

import fs from 'fs';
import path from 'path';
import { generateCoursePdf } from '@/utils/generateCoursePdf';
import type { ExpandedCourseContent } from '@/services/openaiEbookService';

const sample: ExpandedCourseContent = {
  title: 'Diseño de Producto Digital: del wireframe al MVP',
  short_description:
    'Aprende a diseñar productos digitales con sentido de negocio: desde el primer wireframe hasta el lanzamiento de un MVP medible.',
  description:
    '<p>Este curso te guía por las decisiones reales que toma un equipo de producto cuando arranca de cero.</p><p>Combinamos investigación, diseño, métricas y comunicación con stakeholders, con casos prácticos en cada lección.</p>',
  author_name: 'Marta Ruiz',
  author_bio: 'Diseñadora de producto sénior con 12 años de experiencia.',
  topics: [
    {
      title: 'Fundamentos del descubrimiento de producto',
      summary:
        'Cómo separar el problema real de la solución imaginada y validar antes de construir.',
      objectives: [
        'Diferenciar discovery de delivery con criterios accionables',
        'Plantear entrevistas que generen evidencia, no opiniones',
        'Sintetizar hallazgos en un brief de producto compartible',
      ],
      lessons: [
        {
          title: '1.1 Qué es el descubrimiento (y qué no lo es)',
          content: '',
          intro:
            'Descubrir un producto no es preguntar a los usuarios qué quieren. Es entender qué problema están intentando resolver y con qué fricciones lidian hoy.',
          body:
            'En este módulo aprenderás a estructurar tu fase de descubrimiento con cuatro herramientas concretas: el árbol de oportunidades, el guion de entrevistas, la matriz de evidencia y el brief de oportunidad.\n\nLa idea central es que toda decisión de delivery debería estar respaldada por evidencia recogida en discovery; cuando no lo está, el riesgo de construir lo equivocado se dispara.',
          example:
            'Carlos, 41 años, fundador en Sevilla, lanzó un marketplace de servicios locales. Antes de escribir una línea de código, dedicó tres semanas a entrevistar a 18 prestadores y 22 clientes potenciales. El brief resultante cambió por completo el alcance del MVP: redujeron categorías de 14 a 3.',
          exercise:
            'Define el problema que tu producto resuelve usando la plantilla "Hoy [usuario] intenta [meta] pero [fricción]". Compártelo con un compañero y pídele que lo desafíe.',
          commonMistakes: [
            'Confundir entrevistas con encuestas de satisfacción',
            'Saltar a ideación antes de tener evidencia clara',
            'Tratar al equipo de delivery como el único intérprete del discovery',
          ],
          checklist: [
            'Tengo claro a quién entrevistar y por qué',
            'Sé qué decisión tomaré con la evidencia que recoja',
            'He compartido el guion con un compañero antes de la primera entrevista',
          ],
          keyPoints: [
            'Discovery no es preguntar qué quieren, es entender qué les frena',
            'La evidencia justifica decisiones; la opinión solo las acompaña',
            'El brief de oportunidad es el activo que conecta discovery con delivery',
          ],
        },
        {
          title: '1.2 Diseño de entrevistas que generan evidencia',
          content: '',
          intro:
            'Una buena entrevista produce hipótesis falsables. Una mala entrevista produce frases que suenan a marketing.',
          body:
            'Vamos a estructurar el guion en tres bloques: contexto, comportamiento pasado y aprendizajes. Cada bloque tiene un objetivo distinto y un set de preguntas que se pueden adaptar a tu dominio.',
          example:
            'Lucía, 28 años, product manager en Lima, entrevistó a 12 fisioterapeutas autónomos para entender cómo gestionaban citas. Reformulando la entrevista para hablar de "la última vez que perdiste un cliente" en lugar de "qué harías diferente", obtuvo insights mucho más accionables.',
          exercise:
            'Reescribe tu guion actual sustituyendo cada pregunta condicional ("¿qué harías?") por una pregunta sobre comportamiento real ("¿qué hiciste la última vez?").',
          checklist: [
            'Mi guion incluye al menos 3 preguntas sobre comportamiento pasado',
            'He ensayado el guion con un compañero',
            'He preparado preguntas de profundización para cada bloque',
          ],
          keyPoints: [
            'Pregunta por hechos pasados, no por intenciones futuras',
            'Cada entrevista debe terminar con una hipótesis nueva',
          ],
        },
      ],
    },
    {
      title: 'De los hallazgos al MVP que importa',
      summary:
        'Cómo traducir evidencia en producto sin perder foco ni alcance.',
      objectives: [
        'Priorizar funcionalidades con criterios pragmáticos',
        'Definir un MVP medible y defendible ante stakeholders',
      ],
      lessons: [
        {
          title: '2.1 Priorización con la matriz Impacto-Esfuerzo',
          content: '',
          intro:
            'Cuando llegan los hallazgos, la tentación es construirlo todo. La priorización seria empieza aceptando que no podrás.',
          body:
            'La matriz Impacto-Esfuerzo te obliga a explicitar dos cosas que la mayoría de equipos asumen: qué entendemos por impacto y cómo medimos el esfuerzo. Vamos a aterrizar ambos para tu contexto.',
          example:
            'Hugo, 36 años, en Bogotá, priorizó 23 funcionalidades para un producto B2B. Tras explicitar que "impacto" significaba "ahorro de tiempo medible para el cliente final", la lista se redujo a 6 funcionalidades de verdad estratégicas.',
          exercise:
            'Define con tu equipo qué métrica concreta usaréis para medir "impacto" en vuestro contexto. Sin esto, la matriz es solo decoración.',
          keyPoints: [
            'Sin definición de impacto, la priorización es opinión disfrazada',
            'El esfuerzo debe estimarse en pares (producto + ingeniería)',
          ],
        },
      ],
    },
  ],
  editorialPlan: {
    globalObjectives: [
      'Conducir un proceso de descubrimiento con criterio',
      'Diseñar entrevistas que generen evidencia',
      'Definir y defender un MVP medible',
      'Comunicar decisiones de producto con stakeholders',
    ],
    targetReader:
      'Diseñadores y product managers junior o intermedios que quieren estructurar su proceso.',
    glossaryCandidates: ['Discovery', 'MVP', 'Brief de oportunidad', 'Wireframe'],
    modules: [
      {
        index: 0,
        title: 'Fundamentos del descubrimiento de producto',
        summary:
          'Cómo separar el problema real de la solución imaginada y validar antes de construir.',
        objectives: [
          'Diferenciar discovery de delivery con criterios accionables',
          'Plantear entrevistas que generen evidencia, no opiniones',
        ],
        definesHere: ['Discovery', 'Brief de oportunidad', 'Matriz de evidencia'],
        leavesForLater: ['Estimación de esfuerzo', 'MVP medible'],
        lessons: [],
      },
      {
        index: 1,
        title: 'De los hallazgos al MVP que importa',
        summary: 'Cómo traducir evidencia en producto sin perder foco ni alcance.',
        objectives: ['Priorizar funcionalidades con criterios pragmáticos'],
        definesHere: ['MVP', 'Matriz Impacto-Esfuerzo'],
        leavesForLater: [],
        lessons: [],
      },
    ],
  },
  glossaryCandidates: ['Discovery', 'MVP', 'Brief de oportunidad', 'Wireframe'],
  glossary: [
    {
      term: 'Brief de oportunidad',
      definition:
        'Documento breve que sintetiza el problema, la evidencia recogida y la oportunidad de producto que se propone abordar. Conecta los hallazgos del discovery con las decisiones de delivery.',
    },
    {
      term: 'Discovery',
      definition:
        'Fase del proceso de producto centrada en entender el problema antes de proponer soluciones. Usa investigación cualitativa, datos y prototipado para reducir el riesgo de construir lo equivocado.',
    },
    {
      term: 'MVP',
      definition:
        'Producto mínimo viable. La versión más pequeña de un producto que permite validar la hipótesis principal con usuarios reales y aprender qué construir a continuación.',
    },
    {
      term: 'Wireframe',
      definition:
        'Representación esquemática de una pantalla o flujo, sin estilos visuales finales, usada para discutir estructura y prioridad antes de invertir en diseño visual.',
    },
  ],
};

async function main() {
  const outDir = path.join(process.cwd(), 'scripts', '.out');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'sample.pdf');
  const bytes = await generateCoursePdf(sample);
  fs.writeFileSync(outPath, bytes);
  console.log(`✓ PDF generated: ${outPath} (${(bytes.length / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error('PDF generation failed:', err);
  process.exit(1);
});
