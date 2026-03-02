import { getSupabase } from '@/lib/supabase';
import { generateCourseStructure } from './openaiService';
import { generateReviews } from './openaiReviewsService';
import { generateCourseFeaturedImage } from './geminiImageService';
import { createCourse as createWpCourse } from './wordpressService';
import { createProduct as createWooProduct } from './woocommerceService';
import { createProduct as createHotmartProduct } from './hotmartService';
import {
  createReviewCategory,
  createReviews as createSiteReviews,
} from './siteReviewsService';
import {
  createCourseCategory,
  assignCourseCategory,
} from './courseCategoryService';
import { PartialPublishError } from '@/utils/partialPublishError';
import type { CourseInputPayload, CourseRecord, CourseStatus } from '@/types';

const REVIEWS_COUNT = parseInt(process.env.COURSE_REVIEWS_COUNT ?? '50', 10);

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

export async function publishCourse(courseId: string): Promise<CourseRecord> {
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

  let wpId: string | null = null;
  let hotmartId: string | null = null;
  let errorLog: string | null = null;

  const price = content.price_sale ?? content.price_original ?? 99.99;

  try {
    hotmartId = await createHotmartProduct(
      content.title,
      content.description,
      price
    );
  } catch (err) {
    errorLog = `Hotmart: ${err instanceof Error ? err.message : String(err)}`;
  }

  const hotmartUrl = hotmartId ? `https://pay.hotmart.com/${hotmartId}` : undefined;

  let featuredImageBuffer: Buffer | undefined;
  if (process.env.GOOGLE_GEMINI_API_KEY) {
    try {
      featuredImageBuffer = await generateCourseFeaturedImage(content);
    } catch {
      // Continue without featured image
    }
  }

  let woocommerceProductId: number | undefined;
  if (
    process.env.WOOCOMMERCE_CONSUMER_KEY &&
    process.env.WOOCOMMERCE_CONSUMER_SECRET
  ) {
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
    } catch (err) {
      errorLog =
        (errorLog ?? '') +
        ` | WooCommerce: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  try {
    wpId = String(
      await createWpCourse(
        content,
        hotmartUrl,
        featuredImageBuffer,
        woocommerceProductId
      )
    );
  } catch (err) {
    if (err instanceof PartialPublishError) {
      wpId = String(err.courseId);
      errorLog =
        (errorLog ?? '') + ` | WordPress: ${err.message}`;
    } else {
      errorLog =
        (errorLog ?? '') +
        ` | WordPress: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  if (wpId) {
    const wpCourseId = Number(wpId);
    try {
      const courseCategory = await createCourseCategory(content.title);
      await assignCourseCategory(wpCourseId, courseCategory.term_id);
    } catch (err) {
      errorLog =
        (errorLog ?? '') +
        ` | Course category: ${err instanceof Error ? err.message : String(err)}`;
    }
    try {
      const reviews = await generateReviews(content.title, REVIEWS_COUNT);
      const reviewCategory = await createReviewCategory(content.title);
      await createSiteReviews(
        wpCourseId,
        reviewCategory.slug,
        reviews,
        reviewCategory.term_id
      );
    } catch (err) {
      errorLog =
        (errorLog ?? '') +
        ` | Site Reviews: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  const status: CourseStatus =
    wpId && hotmartId ? 'published' : errorLog ? 'error' : 'draft';

  const { data: updated, error: updateError } = await supabase
    .from('courses')
    .update({
      wp_course_id: wpId ?? course.wp_course_id,
      hotmart_product_id: hotmartId ?? course.hotmart_product_id,
      status,
      error_log: errorLog ?? null,
    })
    .eq('id', courseId)
    .select()
    .single();

  if (updateError) throw new Error(`DB update failed: ${updateError.message}`);

  return updated as CourseRecord;
}
