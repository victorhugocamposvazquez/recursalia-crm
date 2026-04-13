import Link from 'next/link';
import Image from 'next/image';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import styles from '../marketing.module.css';
import type { GeneratedCourseStructure } from '@/types';

export const revalidate = 60;

type CourseRow = {
  id: string;
  public_slug: string;
  published_title: string | null;
  topic: string;
  featured_image_url: string | null;
  generated_content: GeneratedCourseStructure | null;
};

export default async function CursosIndexPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const rawQ = searchParams.q;
  const qParam = typeof rawQ === 'string' ? rawQ.trim() : '';
  const qLower = qParam.toLowerCase();

  let courses: CourseRow[] = [];

  try {
    const supabase = createPublicSupabaseClient();
    const { data } = await supabase
      .from('courses')
      .select(
        'id, public_slug, published_title, topic, featured_image_url, generated_content'
      )
      .eq('status', 'published')
      .not('public_slug', 'is', null)
      .order('published_at', { ascending: false });

    courses = (data ?? []) as CourseRow[];
  } catch {
    courses = [];
  }

  if (qLower) {
    courses = courses.filter((c) => {
      const gc = c.generated_content;
      const title = (c.published_title || gc?.title || c.topic || '').toLowerCase();
      const topic = (c.topic || '').toLowerCase();
      return title.includes(qLower) || topic.includes(qLower);
    });
  }

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2>{qParam ? 'Resultados en el catálogo' : 'Cursos'}</h2>
        {qParam ? (
          <p className={styles.empty} style={{ marginBottom: '1.25rem' }}>
            Filtro: «{qParam}» ·{' '}
            <Link href="/cursos" style={{ color: 'var(--ch-blue)', fontWeight: 700 }}>
              Ver todos
            </Link>
          </p>
        ) : null}
        {courses.length === 0 ? (
          <p className={styles.empty}>
            {qParam
              ? 'No hay cursos que coincidan. Prueba otra categoría o mira el catálogo completo.'
              : 'Aún no hay cursos publicados. Ejecuta la migración SQL en Supabase y publica desde el panel.'}
          </p>
        ) : (
          <div className={styles.grid}>
            {courses.map((c) => {
              const gc = c.generated_content;
              const title = c.published_title || gc?.title || c.topic;
              const desc = gc?.short_description ?? '';
              return (
                <article key={c.id} className={styles.card}>
                  <Link href={`/cursos/${c.public_slug}`}>
                    <div className={styles.cardImage}>
                      {c.featured_image_url ? (
                        <Image
                          src={c.featured_image_url}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : null}
                    </div>
                    <div className={styles.cardBody}>
                      <h3>{title}</h3>
                      {desc ? <p>{desc}</p> : null}
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
