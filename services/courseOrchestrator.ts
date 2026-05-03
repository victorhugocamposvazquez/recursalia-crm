import { getSupabase } from '@/lib/supabase';
import { generateCourseStructure } from './openaiService';
import { generateReviews } from './openaiReviewsService';
import { generateCourseFeaturedImage } from './geminiImageService';
import { uploadCourseCoverImage } from './courseMediaService';
import {
  resolveUniquePublicSlug,
  replaceCourseReviews,
} from './coursePublicService';
import type {
  CourseInputPayload,
  CourseRecord,
  CourseStatus,
  GeneratedCourseStructure,
} from '@/types';

export interface ReviewsConfig {
  reviewsCount?: number;
  reviewsAvgRating?: 'high' | 'mixed';
  reviewsPrompt?: string;
}

const DEFAULT_REVIEWS_COUNT = parseInt(process.env.COURSE_REVIEWS_COUNT ?? '50', 10);

export async function generateAndSaveCourse(
  payload: CourseInputPayload
): Promise<CourseRecord> {
  const supabase = getSupabase();
  const { data: insertData, error: insertError } = await supabase
    .from('courses')
    .insert({
      topic: payload.topic,
      input_payload: payload,
      status: 'draft',
    })
    .select()
    .single();

  if (insertError) throw new Error(`DB insert failed: ${insertError.message}`);

  const courseId = insertData.id;

  try {
    const generatedContent = await generateCourseStructure(payload);

    const { error: updateError } = await supabase
      .from('courses')
      .update({ generated_content: generatedContent })
      .eq('id', courseId);

    if (updateError) throw new Error(`DB update failed: ${updateError.message}`);

    return { ...insertData, generated_content: generatedContent };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await getSupabase()
      .from('courses')
      .update({ status: 'error', error_log: msg })
      .eq('id', courseId);
    throw err;
  }
}

export async function publishCourse(
  courseId: string,
  reviewsCfg?: ReviewsConfig
): Promise<CourseRecord> {
  const supabase = getSupabase();
  const { data: course, error: fetchError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (fetchError || !course) {
    throw new Error('Course not found');
  }

  const content = course.generated_content;
  if (!content) {
    throw new Error('Course has no generated content');
  }

  if (course.status === 'published') {
    return course as CourseRecord;
  }

  let errorLog: string | null = null;
  const progressLines: string[] = [];

  const setProgress = async (message: string) => {
    const line = `[${new Date().toLocaleTimeString('es-ES', {
      hour12: false,
    })}] ${message}`;
    progressLines.push(line);
    await supabase
      .from('courses')
      .update({ error_log: progressLines.join('\n') })
      .eq('id', courseId);
  };

  await setProgress('Publicación para la web Next + Supabase...');

  let featuredImageBuffer: Buffer | undefined;
  if (process.env.GOOGLE_GEMINI_API_KEY) {
    await setProgress('Generando imagen destacada con Gemini...');
    try {
      featuredImageBuffer = await generateCourseFeaturedImage(content);
      await setProgress(`Imagen generada (${featuredImageBuffer.length} bytes).`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await setProgress(`Imagen falló: ${msg}`);
    }
  } else {
    await setProgress('Gemini omitido (GOOGLE_GEMINI_API_KEY no configurada).');
  }

  let featuredImageUrl: string | null = course.featured_image_url ?? null;
  if (featuredImageBuffer && featuredImageBuffer.length > 0) {
    await setProgress('Subiendo portada a Supabase Storage...');
    try {
      featuredImageUrl = await uploadCourseCoverImage(
        courseId,
        featuredImageBuffer,
        'image/png'
      );
      await setProgress('Portada en Storage OK.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errorLog = (errorLog ?? '') + ` | Storage portada: ${msg}`;
      await setProgress(`Storage portada falló: ${msg}`);
    }
  }

  const revCount = reviewsCfg?.reviewsCount ?? DEFAULT_REVIEWS_COUNT;
  const revRating = reviewsCfg?.reviewsAvgRating ?? 'high';
  let revPrompt = reviewsCfg?.reviewsPrompt;
  if (revRating === 'high') {
    revPrompt =
      (revPrompt ? revPrompt + '\n' : '') +
      'Valoraciones altas: la gran mayoria (80%) deben ser 5 estrellas, el resto 4 estrellas. Alguna de 3 estrellas aislada para credibilidad.';
  } else {
    revPrompt =
      (revPrompt ? revPrompt + '\n' : '') +
      'Valoraciones mixtas: 40% de 5 estrellas, 30% de 4, 20% de 3 y 10% de 2. Variedad para credibilidad.';
  }

  await setProgress(`Generando ${revCount} resenas (valoracion: ${revRating})...`);
  try {
    const reviews = await generateReviews(content.title, revCount, revPrompt);
    await replaceCourseReviews(courseId, reviews);
    await setProgress('Resenas guardadas en Supabase.');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errorLog = (errorLog ?? '') + ` | Resenas Supabase: ${msg}`;
    await setProgress(
      `Generacion o guardado de resenas fallo: ${msg.slice(0, 280)}`
    );
  }

  let publicSlug: string | null = null;
  try {
    publicSlug = await resolveUniquePublicSlug(content.title, courseId);
    await setProgress(`Slug publico: ${publicSlug}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errorLog = (errorLog ?? '') + ` | Slug: ${msg}`;
    await setProgress(`Slug publico fallo: ${msg.slice(0, 280)}`);
  }

  const ready = Boolean(publicSlug);
  const status: CourseStatus = ready ? 'published' : 'error';

  if (status === 'published') {
    await setProgress('Publicacion completada.');
  }

  const finalLog = errorLog
    ? progressLines.join('\n') + '\n--- ERRORES ---\n' + errorLog
    : progressLines.join('\n');

  const metaDesc = (content.short_description || content.description || '').slice(0, 320);

  const { data: updated, error: updateError } = await supabase
    .from('courses')
    .update({
      public_slug: publicSlug,
      published_title: content.title,
      published_at: status === 'published' ? new Date().toISOString() : null,
      meta_title: content.title,
      meta_description: metaDesc || null,
      featured_image_url: featuredImageUrl,
      status,
      error_log: finalLog,
    })
    .eq('id', courseId)
    .select()
    .single();

  if (updateError) throw new Error(`DB update failed: ${updateError.message}`);

  return updated as CourseRecord;
}

export type RepublishPublicOptions = {
  regenerateFeaturedImage?: boolean;
  regenerateReviews?: boolean;
  reviewsCount?: number;
  reviewsAvgRating?: 'high' | 'mixed';
  reviewsPrompt?: string;
};

/**
 * Sincroniza el curso actual con el sitio Next (/cursos/[slug]): slug (conserva si existe),
 * SEO desde generated_content, portada y reseñas opcionales.
 */
export async function republishPublicSnapshot(
  courseId: string,
  opts?: RepublishPublicOptions
): Promise<CourseRecord> {
  const supabase = getSupabase();
  const { data: course, error: fetchError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (fetchError || !course) throw new Error('Course not found');

  const content = course.generated_content as GeneratedCourseStructure | null;
  if (!content) throw new Error('Course has no generated content');

  const logBits: string[] = [];
  const stamp = () =>
    `[${new Date().toLocaleTimeString('es-ES', { hour12: false })}]`;

  let featuredImageUrl: string | null = course.featured_image_url ?? null;

  if (opts?.regenerateFeaturedImage && process.env.GOOGLE_GEMINI_API_KEY) {
    logBits.push(`${stamp()} Regenerando portada (Gemini)...`);
    try {
      const buf = await generateCourseFeaturedImage(content);
      featuredImageUrl = await uploadCourseCoverImage(
        courseId,
        buf,
        'image/png'
      );
      logBits.push(`${stamp()} Portada subida OK.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logBits.push(`${stamp()} Portada falló: ${msg.slice(0, 220)}`);
    }
  } else if (
    opts?.regenerateFeaturedImage &&
    !process.env.GOOGLE_GEMINI_API_KEY
  ) {
    logBits.push(`${stamp()} Portada: sin GOOGLE_GEMINI_API_KEY; se conserva la actual.`);
  }

  if (opts?.regenerateReviews) {
    const revCount =
      opts.reviewsCount ?? parseInt(process.env.COURSE_REVIEWS_COUNT ?? '50', 10);
    const revRating = opts.reviewsAvgRating ?? 'high';
    let revPrompt = opts.reviewsPrompt?.trim();
    if (revRating === 'high') {
      revPrompt =
        (revPrompt ? `${revPrompt}\n` : '') +
        'Valoraciones altas: la gran mayoría (80%) deben ser 5 estrellas, el resto 4 estrellas. Alguna de 3 estrellas aislada para credibilidad.';
    } else {
      revPrompt =
        (revPrompt ? `${revPrompt}\n` : '') +
        'Valoraciones mixtas: 40% de 5 estrellas, 30% de 4, 20% de 3 y 10% de 2. Variedad para credibilidad.';
    }
    logBits.push(`${stamp()} Regenerando ${revCount} reseñas (IA)...`);
    try {
      const reviews = await generateReviews(content.title, revCount, revPrompt);
      await replaceCourseReviews(courseId, reviews);
      logBits.push(`${stamp()} Reseñas actualizadas en Supabase.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logBits.push(`${stamp()} Reseñas falló: ${msg.slice(0, 280)}`);
    }
  }

  let publicSlug: string | null = course.public_slug?.trim() || null;
  if (!publicSlug) {
    publicSlug = await resolveUniquePublicSlug(content.title, courseId);
    logBits.push(`${stamp()} Slug asignado: ${publicSlug}`);
  }

  const metaDesc = (
    content.short_description ||
    content.description ||
    ''
  ).slice(0, 320);

  const prevPublishedAt = course.published_at;
  const publishedAt =
    typeof prevPublishedAt === 'string' && prevPublishedAt.trim()
      ? prevPublishedAt
      : new Date().toISOString();

  logBits.push(`${stamp()} Snapshot público sincronizado.`);

  const { data: updated, error: updateError } = await supabase
    .from('courses')
    .update({
      public_slug: publicSlug,
      published_title: content.title,
      meta_title: content.title,
      meta_description: metaDesc || null,
      featured_image_url: featuredImageUrl,
      status: 'published',
      published_at: publishedAt,
      error_log: logBits.join('\n'),
    })
    .eq('id', courseId)
    .select()
    .single();

  if (updateError) throw new Error(`DB update failed: ${updateError.message}`);

  return updated as CourseRecord;
}
