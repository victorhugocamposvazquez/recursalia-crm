import { getSupabase } from '@/lib/supabase';
import { generateCourseStructure } from './openaiService';
import { generateReviews } from './openaiReviewsService';
import { generateCourseFeaturedImage } from './geminiImageService';
import { uploadCourseCoverImage } from './courseMediaService';
import {
  resolveUniquePublicSlug,
  replaceCourseReviews,
} from './coursePublicService';
import {
  buildReviewsRatingInstruction,
  normalizeReviewsRatingPreset,
} from '@/lib/reviewsRatingPreset';
import { buildManualCourseSkeleton } from '@/services/manualCourseSkeleton';
import { normalizeGeneratedContentIdentity } from '@/lib/normalizeGeneratedContentIdentity';
import type {
  CourseInputPayload,
  CourseRecord,
  CourseStatus,
  GeneratedCourseStructure,
} from '@/types';

export interface ReviewsConfig {
  reviewsCount?: number;
  /** Perfil de distribución de estrellas (stellar, high, good, mixed, critical). */
  reviewsAvgRating?: string;
  reviewsPrompt?: string;
}

const DEFAULT_REVIEWS_COUNT = parseInt(process.env.COURSE_REVIEWS_COUNT ?? '50', 10);

/**
 * Genera el borrador con IA y persiste `generated_content` + `public_slug` estable.
 * Invariante: `public_slug` no se sobrescribe una vez asignado; aquí solo se rellena si sigue vacío.
 */
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

  const insertRow = insertData as CourseRecord;
  const courseId = insertRow.id;

  try {
    const generatedContentRaw = await generateCourseStructure(
      payload,
      courseId
    );
    const generatedContent = { ...generatedContentRaw };
    normalizeGeneratedContentIdentity(generatedContent);

    const hadSlug =
      insertRow.public_slug != null &&
      String(insertRow.public_slug).trim().length > 0;
    let publicSlug: string = hadSlug
      ? String(insertRow.public_slug).trim()
      : await resolveUniquePublicSlug(generatedContent.title, courseId);
    if (hadSlug) {
      console.info(
        `[course ${courseId}] Slug publico existente: ${publicSlug}`
      );
    } else {
      console.info(
        `[course ${courseId}] Slug publico asignado: ${publicSlug}`
      );
    }

    const { error: updateError } = await supabase
      .from('courses')
      .update({
        generated_content: generatedContent,
        public_slug: publicSlug,
      })
      .eq('id', courseId);

    if (updateError) throw new Error(`DB update failed: ${updateError.message}`);

    return {
      ...insertRow,
      generated_content: generatedContent,
      public_slug: publicSlug,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await getSupabase()
      .from('courses')
      .update({ status: 'error', error_log: msg })
      .eq('id', courseId);
    throw err;
  }
}

/**
 * Inserta un curso/guía en borrador con `generated_content` vacío pero
 * estructura completa editable (sin llamar a la IA).
 */
export async function createManualDraftCourse(
  payload: CourseInputPayload
): Promise<CourseRecord> {
  const supabase = getSupabase();
  const enriched: CourseInputPayload = { ...payload, creationMode: 'manual' };
  const generatedContentRaw = buildManualCourseSkeleton(enriched);
  const generatedContent = { ...generatedContentRaw };
  normalizeGeneratedContentIdentity(generatedContent);
  const publicSlug = await resolveUniquePublicSlug(generatedContent.title);
  const { data: insertData, error: insertError } = await supabase
    .from('courses')
    .insert({
      topic: enriched.topic.trim(),
      input_payload: enriched,
      generated_content: generatedContent,
      public_slug: publicSlug,
      status: 'draft',
    })
    .select()
    .single();

  if (insertError) throw new Error(`DB insert failed: ${insertError.message}`);

  return { ...(insertData as CourseRecord), generated_content: generatedContent };
}

/**
 * Primera publicación del curso en la web (Next + Supabase).
 *
 * Invariante: `public_slug` es estable; una vez asignado, nunca se sobrescribe.
 * Si el borrador ya tiene `public_slug` (p. ej. asignado al generar el draft), se reutiliza.
 */
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

  const existingCover = course.featured_image_url?.trim() || null;

  let featuredImageBuffer: Buffer | undefined;
  if (existingCover) {
    await setProgress('Portada manual ya guardada; se omite Gemini en esta publicación.');
  } else if (process.env.GOOGLE_GEMINI_API_KEY) {
    await setProgress('Generando imagen destacada con Gemini...');
    try {
      featuredImageBuffer = await generateCourseFeaturedImage(
        content,
        courseId
      );
      await setProgress(`Imagen generada (${featuredImageBuffer.length} bytes).`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await setProgress(`Imagen falló: ${msg}`);
    }
  } else {
    await setProgress('Gemini omitido (GOOGLE_GEMINI_API_KEY no configurada).');
  }

  let featuredImageUrl: string | null = existingCover ?? null;
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
  const preset = normalizeReviewsRatingPreset(reviewsCfg?.reviewsAvgRating);
  const ratingInstruction = buildReviewsRatingInstruction(preset);
  let revPrompt = reviewsCfg?.reviewsPrompt?.trim();
  revPrompt = revPrompt
    ? `${revPrompt}\n\n${ratingInstruction}`
    : ratingInstruction;

  await setProgress(
    `Generando ${revCount} resenas (perfil: ${preset})...`
  );
  try {
    const reviews = await generateReviews(
      content.title,
      revCount,
      revPrompt,
      courseId
    );
    await replaceCourseReviews(courseId, reviews);
    await setProgress('Resenas guardadas en Supabase.');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errorLog = (errorLog ?? '') + ` | Resenas Supabase: ${msg}`;
    await setProgress(
      `Generacion o guardado de resenas fallo: ${msg.slice(0, 280)}`
    );
  }

  let publicSlug: string | null = course.public_slug?.trim() || null;
  try {
    if (!publicSlug) {
      publicSlug = await resolveUniquePublicSlug(content.title, courseId);
      if (publicSlug) {
        await setProgress(`Slug publico asignado: ${publicSlug}`);
      }
    } else {
      await setProgress(`Slug publico existente: ${publicSlug}`);
    }
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

  const freezeSnapshot =
    status === 'published' &&
    !(course as { published_content_snapshot?: unknown }).published_content_snapshot;

  const { data: updated, error: updateError } = await supabase
    .from('courses')
    .update({
      public_slug: publicSlug,
      published_title: content.title,
      published_at: status === 'published' ? new Date().toISOString() : null,
      meta_title: content.title,
      meta_description: metaDesc || null,
      featured_image_url: featuredImageUrl,
      ...(freezeSnapshot ? { published_content_snapshot: content } : {}),
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
  reviewsAvgRating?: string;
  reviewsPrompt?: string;
};

/**
 * Sincroniza el curso actual con el sitio Next (/cursos/[slug]): SEO desde generated_content,
 * portada y reseñas opcionales.
 *
 * Invariante: `public_slug` es estable; una vez asignado, nunca se sobrescribe.
 * Si falta slug, se calcula una sola vez con el título actual.
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
      const buf = await generateCourseFeaturedImage(content, courseId);
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
    const preset = normalizeReviewsRatingPreset(opts.reviewsAvgRating);
    const ratingInstruction = buildReviewsRatingInstruction(preset);
    let revPrompt = opts.reviewsPrompt?.trim();
    revPrompt = revPrompt
      ? `${revPrompt}\n\n${ratingInstruction}`
      : ratingInstruction;
    logBits.push(`${stamp()} Regenerando ${revCount} resenas (perfil ${preset})...`);
    try {
      const reviews = await generateReviews(
        content.title,
        revCount,
        revPrompt,
        courseId
      );
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
