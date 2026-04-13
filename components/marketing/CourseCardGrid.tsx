import Link from 'next/link';
import Image from 'next/image';
import type { GeneratedCourseStructure } from '@/types';
import styles from '@/app/(marketing)/marketing.module.css';

export type CourseCardItem = {
  id: string;
  public_slug: string;
  published_title: string | null;
  topic: string;
  featured_image_url: string | null;
  generated_content: GeneratedCourseStructure | null;
};

export function CourseCardGrid({ courses }: { courses: CourseCardItem[] }) {
  if (courses.length === 0) {
    return (
      <p className={styles.empty}>
        Aún no hay cursos publicados. Publica desde el panel para mostrarlos aquí.
      </p>
    );
  }

  return (
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
  );
}
