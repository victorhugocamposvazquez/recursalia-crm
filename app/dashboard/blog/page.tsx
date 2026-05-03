'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import styles from './blog-dashboard.module.css';

type OverviewRow = {
  id: string;
  topic: string;
  displayTitle: string;
  public_slug: string | null;
  drafts: number;
  published: number;
};

export default function DashboardBlogIndexPage() {
  const [courses, setCourses] = useState<OverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/blog/course-overview');
      const data = await res.json();
      if (!res.ok) throw new Error(data.details ?? data.error);
      setCourses((data.courses ?? []) as OverviewRow[]);
    } catch (e) {
      setCourses([]);
      setError(e instanceof Error ? e.message : String(e));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Blog · por curso</h1>
      <p className={styles.sub}>
        Elige un curso publicado para ver y editar solo sus artículos SEO (borradores y publicados).
        La generación masiva sigue en <Link href="/dashboard/seo-posts">Posts SEO</Link>.
      </p>

      {error && <p className={styles.msgErr}>{error}</p>}

      {loading ? (
        <p className={styles.muted}>Cargando…</p>
      ) : courses.length === 0 ? (
        <p className={styles.muted}>
          No tienes ningún curso publicado todavía. Publica uno y crea articulos desde{' '}
          <Link href="/dashboard/seo-posts">Posts SEO</Link>.
        </p>
      ) : (
        <ul className={styles.courseGrid}>
          {courses.map((c) => {
            const total = c.drafts + c.published;
            return (
              <li key={c.id} className={styles.courseCard}>
                <Link href={`/dashboard/blog/${encodeURIComponent(c.id)}`} className={styles.courseCardLink}>
                  <span className={styles.courseCardTitle}>{c.displayTitle}</span>
                  <span className={styles.courseCardTopic}>{c.topic}</span>
                  <span className={styles.courseCardCounts}>
                    {c.drafts} borrador{c.drafts === 1 ? '' : 'es'} · {c.published} publicado
                    {c.published === 1 ? '' : 's'} · {total} total
                  </span>
                </Link>
                <div className={styles.courseCardActions}>
                  <Link href={`/dashboard/courses/${c.id}`} className={styles.courseCardTinyLink}>
                    Ficha curso
                  </Link>
                  {c.public_slug ? (
                    <Link href={`/cursos/${encodeURIComponent(c.public_slug)}`} className={styles.courseCardTinyLink}>
                      Web
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
