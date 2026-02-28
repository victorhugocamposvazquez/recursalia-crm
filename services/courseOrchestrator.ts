import { getSupabase } from '@/lib/supabase';
import { generateCourseStructure } from './openaiService';
import { createCourse as createWpCourse } from './wordpressService';
import { createProduct as createHotmartProduct } from './hotmartService';
import type { CourseInputPayload, CourseRecord, CourseStatus } from '@/types';

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

  try {
    wpId = String(await createWpCourse(content));
  } catch (err) {
    errorLog = `WordPress: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    hotmartId = await createHotmartProduct(
      content.title,
      content.description,
      99.99
    );
  } catch (err) {
    errorLog =
      (errorLog ?? '') +
      ` | Hotmart: ${err instanceof Error ? err.message : String(err)}`;
  }

  const status: CourseStatus =
    wpId && hotmartId ? 'published' : errorLog ? 'error' : 'draft';

  const { data: updated, error: updateError } = await supabase
    .from('courses')
    .update({
      wp_course_id: wpId ?? course.wp_course_id,
      hotmart_product_id: hotmartId ?? course.hotmart_product_id,
      status,
      error_log: errorLog ?? course.error_log,
    })
    .eq('id', courseId)
    .select()
    .single();

  if (updateError) throw new Error(`DB update failed: ${updateError.message}`);

  return updated as CourseRecord;
}
