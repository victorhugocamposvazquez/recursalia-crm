import { getSupabase } from '@/lib/supabase';

export async function uploadCourseCoverImage(
  courseId: string,
  buffer: Buffer,
  contentType: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png'
): Promise<string> {
  const supabase = getSupabase();
  const ext =
    contentType === 'image/jpeg' ? 'jpg' : contentType === 'image/webp' ? 'webp' : 'png';
  const path = `${courseId}/cover.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('course_media')
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from('course_media').getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error('No public URL for uploaded cover');
  }
  return data.publicUrl;
}
