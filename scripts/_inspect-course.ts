import './loadEnv';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const sb = createClient(url, key);
  const slug = process.argv[2] ?? 'curso-de-fotografia-captura-el-mundo-a-traves-de-tu-lente';
  const { data: c } = await sb
    .from('courses')
    .select('id, generated_content, public_slug')
    .eq('public_slug', slug)
    .maybeSingle();
  if (!c) {
    console.error('Curso no encontrado:', slug);
    process.exit(1);
  }
  console.log('Course id:', c.id);
  const topics = c.generated_content?.topics ?? [];
  console.log('Topics:', topics.length);
  for (const t of topics) {
    console.log(`  - topic ${t.id} :: ${t.title} :: ${t.lessons?.length ?? 0} lessons`);
  }
  const { data: qs } = await sb
    .from('quizzes')
    .select('id, title, topic_id, lesson_id, is_final, module_position')
    .eq('course_id', c.id);
  console.log('\nQuizzes total:', qs?.length ?? 0);
  console.log(JSON.stringify(qs, null, 2));
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
