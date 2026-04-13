import Link from 'next/link';
import Image from 'next/image';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import styles from '../marketing.module.css';
import type { GeneratedCourseStructure } from '@/types';

export const revalidate = 60;

export default async function CursosIndexPage() {
  let courses: {
    id: string;
    public_slug: string;
    published_title: string | null;
    topic: string;
    featured_image_url: string | null;
    generated_content: GeneratedCourseStructure | null;
  }[] = [];

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

    courses = (data ?? []) as typeof courses;
  } catch {
    courses = [];
  }

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2>Cursos</h2>
        {courses.length === 0 ? (
          <p className={styles.empty}>
            Aún no hay cursos publicados. Ejecuta la migración SQL en Supabase y publica desde el
            panel.
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
