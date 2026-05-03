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
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Tema</th>
                <th>Entradas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => {
                const total = c.drafts + c.published;
                return (
                  <tr key={c.id}>
                    <td className={styles.tableTitleCell}>
                      <Link href={`/dashboard/blog/${encodeURIComponent(c.id)}`}>{c.displayTitle}</Link>
                    </td>
                    <td className={styles.tableTopic}>{c.topic}</td>
                    <td className={styles.tableCounts}>
                      {c.drafts} borrador{c.drafts === 1 ? '' : 'es'} · {c.published} publicado
                      {c.published === 1 ? '' : 's'} · {total} total
                    </td>
                    <td className={styles.actionsCell}>
                      <Link
                        href={`/dashboard/blog/${encodeURIComponent(c.id)}`}
                        className={`${styles.tableAction} ${styles.tableActionAccent}`}
                      >
                        Gestionar posts
                      </Link>
                      <Link href={`/dashboard/courses/${c.id}`} className={styles.tableAction}>
                        Ficha curso
                      </Link>
                      {c.public_slug ? (
                        <Link
                          href={`/cursos/${encodeURIComponent(c.public_slug)}`}
                          className={styles.tableAction}
                        >
                          Web
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className={styles.totalFooter}>Total: {courses.length} curso{courses.length === 1 ? '' : 's'}</p>
        </div>
      )}
    </div>
  );
}
