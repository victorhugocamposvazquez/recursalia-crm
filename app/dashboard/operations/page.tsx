'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './operations.module.css';
import type { CourseRecord } from '@/types';

interface OpsPayload {
  courses: CourseRecord[];
  reviewCountByCourse: Record<string, number>;
  aggregates: {
    total: number;
    published: number;
    draft: number;
    error: number;
    publishedMissingImage: number;
    publishedMissingHotmart: number;
    draftWithReviewErrorsFlag: number;
  };
}

export default function OperationsPage() {
  const [data, setData] = useState<OpsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch('/api/dashboard/operations');
        const js = await res.json();
        if (!res.ok) throw new Error(js.details ?? js.error ?? 'Error');
        if (!cancel) setData(js as OpsPayload);
      } catch (e) {
        if (!cancel) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const flagged = useMemo(() => {
    const courses = data?.courses ?? [];
    const rc = data?.reviewCountByCourse ?? {};
    return courses.filter((c) => {
      const pub = c.status === 'published';
      const reviews = rc[c.id] ?? 0;
      const missImg = pub && !c.featured_image_url?.trim();
      const missHm =
        pub && !(c.hotmart_product_id && /^https?:\/\//i.test(c.hotmart_product_id.trim()));
      const staleErr = Boolean(c.error_log?.includes('--- ERRORES ---'));
      const noReviewsPub = pub && reviews === 0;
      return staleErr || missImg || missHm || noReviewsPub || c.status === 'error';
    });
  }, [data]);

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  const agg = data?.aggregates;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Operaciones</h1>
      <p className={styles.sub}>
        Panorama rápido para limpiar cursores y acelerar lanzamientos sin abrir curso a curso.
      </p>

      {agg ? (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Totales</span>
            <strong>{agg.total}</strong>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Publicados</span>
            <strong>{agg.published}</strong>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Borradores</span>
            <strong>{agg.draft}</strong>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Errores estado</span>
            <strong>{agg.error}</strong>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Publicados sin imagen</span>
            <strong>{agg.publishedMissingImage}</strong>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Borradores con log de error</span>
            <strong>{agg.draftWithReviewErrorsFlag}</strong>
          </div>
        </div>
      ) : (
        <p className={styles.muted}>Cargando…</p>
      )}

      <h2 className={styles.sectionTitle}>Prioridad de revisión ({flagged.length})</h2>
      {flagged.length === 0 ? (
        <p className={styles.muted}>Sin incidencias rápidas detectadas.</p>
      ) : (
        <ul className={styles.issueList}>
          {flagged.map((c) => (
            <li key={c.id} className={styles.issueItem}>
              <Link href={`/dashboard/courses/${c.id}`} className={styles.issueLink}>
                {c.generated_content?.title ?? c.topic}
              </Link>
              <span className={styles.badge}>{c.status}</span>
              <ul className={styles.issueMeta}>
                {c.status === 'error' && <li>Error de estado</li>}
                {(data?.reviewCountByCourse[c.id] ?? 0) === 0 && c.status === 'published' && (
                  <li>Sin reseñas en Supabase</li>
                )}
                {c.featured_image_url?.trim()
                  ? null
                  : c.status === 'published' && <li>Falta portada</li>}
                {/^https?:\/\//i.test(c.hotmart_product_id ?? '')
                  ? null
                  : c.status === 'published' && <li>Falta enlace Hotmart</li>}
                {c.error_log?.includes('--- ERRORES ---') && (
                  <li>Log publicación con errores parciales</li>
                )}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
