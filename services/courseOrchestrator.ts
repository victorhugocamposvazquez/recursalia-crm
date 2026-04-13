import { getSupabase } from '@/lib/supabase';
import { generateCourseStructure } from './openaiService';
import { generateReviews } from './openaiReviewsService';
import { generateCourseFeaturedImage } from './geminiImageService';
import { createCourse as createWpCourse } from './wordpressService';
import { createProduct as createWooProduct } from './woocommerceService';
import {
  createReviewCategory,
  createReviews as createSiteReviews,
} from './siteReviewsService';
import {
  createCourseCategory,
  assignCourseCategory,
} from './courseCategoryService';
import { PartialPublishError } from '@/utils/partialPublishError';
import { setCourseProduct, setCourseAssignedTerm } from './wordpressCourseMetaService';
import { createCurriculum } from './tutorLmsService';
import { uploadCourseCoverImage } from './courseMediaService';
import {
  resolveUniquePublicSlug,
  replaceCourseReviews,
} from './coursePublicService';
import type { CourseInputPayload, CourseRecord, CourseStatus } from '@/types';

export interface ReviewsConfig {
  reviewsCount?: number;
  reviewsAvgRating?: 'high' | 'mixed';
  reviewsPrompt?: string;
}

const DEFAULT_REVIEWS_COUNT = parseInt(process.env.COURSE_REVIEWS_COUNT ?? '50', 10);

function wordpressPublishEnabled(): boolean {
  return (
    Boolean(process.env.WORDPRESS_URL?.trim()) &&
    process.env.WORDPRESS_PUBLISH_ENABLED !== 'false'
  );
}

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

  const wordpressEnabled = wordpressPublishEnabled();

  let wpId: string | null = null;
  let errorLog: string | null = null;
  let retryProduct = false;
  let retryCurriculum = false;
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

  await setProgress('Iniciando publicacion...');

  const price = content.price_sale ?? content.price_original ?? 99.99;

  let featuredImageBuffer: Buffer | undefined;
  if (process.env.GOOGLE_GEMINI_API_KEY) {
    await setProgress('Generando imagen destacada con Gemini...');
    try {
      featuredImageBuffer = await generateCourseFeaturedImage(content);
      await setProgress(`Imagen generada (${featuredImageBuffer.length} bytes).`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await setProgress(`Imagen fallo: ${msg}`);
    }
  } else {
    await setProgress('Imagen omitida (GOOGLE_GEMINI_API_KEY no configurada).');
  }

  let featuredImageUrl: string | null = null;
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
      await setProgress(`Storage portada fallo: ${msg}`);
    }
  }

  let woocommerceProductId: number | undefined;
  if (
    wordpressEnabled &&
    process.env.WOOCOMMERCE_CONSUMER_KEY &&
    process.env.WOOCOMMERCE_CONSUMER_SECRET
  ) {
    await setProgress('Creando producto en WooCommerce...');
    try {
      const regularPrice = content.price_original ?? content.price_sale ?? price;
      const salePrice =
        content.price_sale && content.price_sale < (content.price_original ?? Infinity)
          ? content.price_sale
          : undefined;

      woocommerceProductId = await createWooProduct({
        name: content.title,
        description: content.description,
        short_description: content.short_description,
        regular_price: regularPrice,
        sale_price: salePrice,
      });
      await setProgress(`WooCommerce OK (id: ${woocommerceProductId})`);
    } catch (err) {
      errorLog =
        (errorLog ?? '') +
        ` | WooCommerce: ${err instanceof Error ? err.message : String(err)}`;
      await setProgress('WooCommerce fallo. Se creara el curso igualmente.');
    }
  } else if (!wordpressEnabled) {
    await setProgress('WooCommerce omitido (publicacion sin WordPress).');
  } else {
    await setProgress('WooCommerce omitido (faltan credenciales).');
  }

  const inputPayload = course.input_payload as CourseInputPayload | undefined;

  if (wordpressEnabled) {
    await setProgress('Publicando curso en WordPress...');
    try {
      wpId = String(
        await createWpCourse(
          content,
          undefined,
          featuredImageBuffer,
          woocommerceProductId,
          inputPayload
        )
      );
      await setProgress(`WordPress OK (id: ${wpId})`);
    } catch (err) {
      if (err instanceof PartialPublishError) {
        wpId = String(err.courseId);
        retryProduct = err.productFailed;
        retryCurriculum = err.curriculumFailed;
        errorLog = (errorLog ?? '') + ` | WordPress: ${err.message}`;
        await setProgress(`WordPress parcial (id: ${wpId}). Reintentando tareas...`);
      } else {
        errorLog =
          (errorLog ?? '') +
          ` | WordPress: ${err instanceof Error ? err.message : String(err)}`;
        await setProgress('WordPress fallo. Categorias WP omitidas.');
      }
    }
  } else {
    await setProgress('WordPress omitido (sin URL o WORDPRESS_PUBLISH_ENABLED=false).');
  }

  if (wpId) {
    const wpCourseId = Number(wpId);
    if (retryProduct && woocommerceProductId) {
      await setProgress('Reintentando asociar producto al curso...');
      try {
        await setCourseProduct(wpCourseId, woocommerceProductId);
        await setProgress('Asociacion de producto OK.');
      } catch (err) {
        errorLog =
          (errorLog ?? '') +
          ` | Retry product: ${err instanceof Error ? err.message : String(err)}`;
        await setProgress('Reintento de producto fallo.');
      }
    }
    if (retryCurriculum && content.topics?.length) {
      await setProgress('Reintentando crear temario...');
      try {
        await createCurriculum(wpCourseId, content);
        await setProgress('Temario OK.');
      } catch (err) {
        errorLog =
          (errorLog ?? '') +
          ` | Retry curriculum: ${err instanceof Error ? err.message : String(err)}`;
        await setProgress('Reintento de temario fallo.');
      }
    }
    await setProgress('Creando y asignando categoria del curso...');
    try {
      const courseCategory = await createCourseCategory(content.title);
      await assignCourseCategory(wpCourseId, courseCategory.term_id);
      await setProgress(`Categoria de curso OK (term_id: ${courseCategory.term_id}).`);
    } catch (err) {
      errorLog =
        (errorLog ?? '') +
        ` | Course category: ${err instanceof Error ? err.message : String(err)}`;
      await setProgress('Categoria de curso fallo.');
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

  let reviewsSaved = false;
  await setProgress(`Generando ${revCount} resenas (valoracion: ${revRating})...`);
  try {
    const reviews = await generateReviews(content.title, revCount, revPrompt);
    await replaceCourseReviews(courseId, reviews);
    reviewsSaved = true;
    await setProgress('Resenas guardadas en Supabase.');

    if (wpId && wordpressEnabled) {
      try {
        const reviewCategory = await createReviewCategory(content.title);
        await createSiteReviews(
          Number(wpId),
          reviewCategory.slug,
          reviews,
          reviewCategory.term_id
        );
        await setCourseAssignedTerm(Number(wpId), reviewCategory.term_id);
        await setProgress(`Resenas Site Reviews WP OK (term_id: ${reviewCategory.term_id}).`);
      } catch (err) {
        errorLog =
          (errorLog ?? '') +
          ` | Site Reviews WP: ${err instanceof Error ? err.message : String(err)}`;
        await setProgress('Resenas Site Reviews WP fallo.');
      }
    }
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

  // Solo sitio Next: basta slug; reseñas opcionales (maquetación / menos dependencia OpenAI).
  // Con WordPress activo: slug + reseñas en Supabase + curso creado en WP.
  const supabaseReady = wordpressEnabled
    ? Boolean(publicSlug && reviewsSaved)
    : Boolean(publicSlug);

  const status: CourseStatus =
    !supabaseReady
      ? 'error'
      : wordpressEnabled && !wpId
        ? 'error'
        : 'published';

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
      wp_course_id: wpId ?? course.wp_course_id,
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
