import {
  COURSE_AUTHOR_BIO_DEFAULT,
  COURSE_AUTHOR_NAME_DEFAULT,
} from '@/lib/courseAuthorDefaults';
import type {
  CourseInputPayload,
  GeneratedBenefit,
  GeneratedCourseStructure,
  GeneratedLesson,
  GeneratedTopic,
} from '@/types';

/**
 * Estructura mínima editable (sin llamar a la IA): módulos y lecciones
 * placeholders listos para rellenar en el panel.
 */
export function buildManualCourseSkeleton(
  payload: CourseInputPayload
): GeneratedCourseStructure {
  const topicsCount = payload.topicsCount ?? 6;
  const lessonsPerTopic = payload.lessonsPerTopic ?? 4;
  const priceOriginal = payload.price ?? 120;
  const discountPct = payload.discountPercent ?? 0;
  const priceSale =
    discountPct > 0
      ? Math.round(priceOriginal * (1 - discountPct / 100))
      : priceOriginal;
  const baseTitle = payload.topic.trim();
  const isGuide = payload.productType === 'guide';

  const topics: GeneratedTopic[] = [];
  for (let t = 1; t <= topicsCount; t++) {
    const lessons: GeneratedLesson[] = [];
    for (let L = 1; L <= lessonsPerTopic; L++) {
      lessons.push({
        title: `Lección ${L}`,
        content: '<p>Escribe aquí el contenido de la lección.</p>',
        duration_minutes: 15,
      });
    }
    topics.push({
      title: isGuide ? `Capítulo ${t}` : `Módulo ${t}`,
      lessons,
    });
  }

  let totalDuration = 0;
  for (const tp of topics) {
    for (const le of tp.lessons) {
      totalDuration += le.duration_minutes;
    }
  }

  const benefits: GeneratedBenefit[] = [
    { icon: '€', title: 'Beneficio 1', description: 'Edita la descripción.' },
    { icon: '📈', title: 'Beneficio 2', description: 'Edita la descripción.' },
    { icon: '🎯', title: 'Beneficio 3', description: 'Edita la descripción.' },
    { icon: '🎓', title: 'Beneficio 4', description: 'Edita la descripción.' },
  ];

  return {
    title: baseTitle,
    description: '<p>Describe el producto aquí (puedes usar HTML).</p>',
    short_description: `Resumen corto de «${baseTitle}». Edita este texto (mín. ~120 caracteres recomendado).`,
    benefits,
    highlight: 'Edita el dato o cifra destacada para la ficha.',
    price_original: priceOriginal,
    price_sale: priceSale,
    badge: payload.bestSeller !== false ? 'Best Seller' : '',
    access_level: 'Todos los niveles',
    certificate: true,
    job_bank: true,
    language: 'Espanol',
    author_name: COURSE_AUTHOR_NAME_DEFAULT,
    author_bio: COURSE_AUTHOR_BIO_DEFAULT,
    topics,
    total_duration_minutes: totalDuration,
  };
}
