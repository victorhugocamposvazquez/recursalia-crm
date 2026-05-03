'use client';

import { useEffect, useState } from 'react';
import type { CourseRecord } from '@/types';
import styles from './course-detail.module.css';

interface Metrics {
  reviewsCount: number;
  draftBlogCount: number;
  siteUrlConfigured: boolean;
}

type Item = {
  ok: boolean;
  label: string;
  hint?: string;
};

export function PublishChecklist({ course, courseId }: { course: CourseRecord; courseId: string }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(`/api/courses/${courseId}/metrics`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? data.details ?? 'Error metricas');
        if (!cancel) setMetrics(data);
      } catch (e) {
        if (!cancel) setErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancel = true;
    };
  }, [
    courseId,
    course.status,
    course.public_slug,
    course.featured_image_url,
    course.hotmart_product_id,
    course.error_log,
  ]);

  const hasErrorsLog = Boolean(course.error_log?.includes('--- ERRORES ---'));
  const published = course.status === 'published';
  const hasSlug = Boolean(course.public_slug?.trim());
  const hasImage = Boolean(course.featured_image_url?.trim());
  const hotmartOk = /^https?:\/\//i.test(course.hotmart_product_id?.trim() ?? '');
  const minReviewsOk = published ? ((metrics?.reviewsCount ?? 0) >= 1) : true;

  const items: Item[] = [
    {
      ok: Boolean(metrics?.siteUrlConfigured),
      label: 'NEXT_PUBLIC_SITE_URL definida (cron y redes)',
      hint:
        metrics?.siteUrlConfigured === false
          ? 'Sin URL canónica, los enlaces de redes y algunos CTAs pueden quedar incompletos.'
          : undefined,
    },
    {
      ok: published ? hasSlug : true,
      label: published ? 'Slug público asignado' : 'Slug: se asignará al publicar',
    },
    {
      ok: published ? hasImage : true,
      label: published ? 'Portada en Storage' : 'Portada opcional antes de lanzar campañas Meta',
      hint:
        published && !hasImage ? 'Instagram requiere imagen para publicar.' : undefined,
    },
    {
      ok: published ? minReviewsOk : true,
      label: published
        ? `Reseñas en Supabase (${metrics?.reviewsCount ?? '…'} publicadas)`
        : 'Reseñas generadas en el flujo de publicación',
      hint:
        metrics === null ? undefined : metrics.reviewsCount === 0
          ? 'Genera desde la ficha o republica marcando regenerar.'
          : undefined,
    },
    {
      ok: published ? hotmartOk : true,
      label: published ? 'Enlace Hotmart configurado' : 'Hotmart al tener producto activo',
    },
    {
      ok: metrics === null ? true : metrics.draftBlogCount > 0,
      label:
        published && metrics
          ? `Borradores blog (${metrics.draftBlogCount}); prioridad alta = antes en cron`
          : 'SEO: tras publicar puedes generar 17 borradores',
      hint:
        published && metrics !== null && metrics.draftBlogCount === 0
          ? 'Prioridad SEO editable en la ficha + generacion en Posts SEO.'
          : undefined,
    },
    {
      ok: !hasErrorsLog,
      label: 'Sin errores en el último log',
      hint: hasErrorsLog ? 'Revisa el bloque inferior de log por detalle.' : undefined,
    },
  ];

  return (
    <aside className={styles.checklistAside} aria-label="Checklist de publicación">
      <h4 className={styles.checklistTitle}>Checklist lanzamiento</h4>
      {err ? <p className={styles.checklistWarn}>{err}</p> : null}
      <ul className={styles.checklistList}>
        {items.map((it) => (
          <li key={it.label} className={styles.checklistItem}>
            <span className={it.ok ? styles.checkOk : styles.checkBad} aria-hidden>
              {it.ok ? '✓' : '!'}
            </span>
            <span>
              {it.label}
              {it.hint ? (
                <>
                  {' '}
                  <span className={styles.checklistHint}>{it.hint}</span>
                </>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
