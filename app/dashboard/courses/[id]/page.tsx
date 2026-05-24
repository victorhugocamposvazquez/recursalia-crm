'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './course-detail.module.css';
import type {
  CourseRecord,
  GeneratedCourseStructure,
} from '@/types';
import {
  defaultLesson,
  defaultTopic,
  withTopics,
} from '@/lib/courseEditorStructure';
import type { ReviewsRatingPreset } from '@/lib/reviewsRatingPreset';
import { REVIEWS_RATING_PRESET_OPTIONS } from '@/lib/reviewsRatingPreset';
import {
  PUBLIC_CATALOG_CATEGORIES_FALLBACK,
  resolveCourseCatalogSlug,
  type CatalogCategoryPublic,
} from '@/lib/catalogCategory';
import { PublishChecklist } from './PublishChecklist';
import { CourseEnrollments } from './CourseEnrollments';

function formatExpandedRelative(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  let duration = diffMs / 1000;
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  const divisions: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
    { amount: 4.34524, unit: 'week' },
    { amount: 12, unit: 'month' },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' },
  ];
  for (const { amount, unit } of divisions) {
    if (Math.abs(duration) < amount) {
      return rtf.format(Math.round(duration), unit);
    }
    duration /= amount;
  }
  return rtf.format(Math.round(duration), 'year');
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [course, setCourse] = useState<CourseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState<GeneratedCourseStructure | null>(null);
  const [hotmartLinkInput, setHotmartLinkInput] = useState('');
  const [savingHotmart, setSavingHotmart] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfTotal, setPdfTotal] = useState(0);
  const [pdfLesson, setPdfLesson] = useState('');
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [reviewsCount, setReviewsCount] = useState(50);
  const [reviewsAvgRating, setReviewsAvgRating] =
    useState<ReviewsRatingPreset>('high');
  const [reviewsPrompt, setReviewsPrompt] = useState('');
  const [republishRegenImage, setRepublishRegenImage] = useState(false);
  const [republishRegenReviews, setRepublishRegenReviews] = useState(false);
  const [seoPublishPriority, setSeoPublishPriority] = useState(0);
  const [seoPrioritySaving, setSeoPrioritySaving] = useState(false);
  const [catalogOptions, setCatalogOptions] = useState<CatalogCategoryPublic[]>(
    PUBLIC_CATALOG_CATEGORIES_FALLBACK,
  );
  const [catalogPublicCategory, setCatalogPublicCategory] = useState<string>('general');
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [socialPosting, setSocialPosting] = useState<'facebook' | 'instagram' | null>(null);
  const [socialMessage, setSocialMessage] = useState('');
  const [socialResult, setSocialResult] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);
  const publishPollRef = useRef<number | null>(null);
  const pdfAbortRef = useRef<AbortController | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [expandGenerating, setExpandGenerating] = useState(false);
  const [expandNotice, setExpandNotice] = useState<
    { kind: 'ok' | 'err'; text: string } | null
  >(null);

  const catalogSelectOptions = useMemo(() => {
    const rows = [...catalogOptions];
    if (
      catalogPublicCategory &&
      !rows.some((o) => o.slug === catalogPublicCategory)
    ) {
      rows.unshift({
        slug: catalogPublicCategory,
        label: `${catalogPublicCategory} (añadir etiqueta en Categorías /cursos)`,
      });
    }
    return rows;
  }, [catalogOptions, catalogPublicCategory]);

  const fetchCourse = useCallback(
    async (syncEditContent: boolean = false) => {
      const res = await fetch(`/api/courses/${id}`);
      const data = await res.json();
      if (res.ok) {
        setCourse(data);
        const link = data.hotmart_product_id;
        setHotmartLinkInput(typeof link === 'string' && link.startsWith('http') ? link : '');
        const count = data.input_payload?.reviewsCount;
        if (typeof count === 'number' && count >= 5 && count <= 200) {
          setReviewsCount(count);
        }
        setSeoPublishPriority(
          typeof data.seo_publish_priority === 'number' ? data.seo_publish_priority : 0,
        );
        setCatalogPublicCategory(
          resolveCourseCatalogSlug(
            typeof data.catalog_category === 'string' ? data.catalog_category : null,
            data.input_payload,
          ),
        );
        if (syncEditContent) {
          setEditContent(data.generated_content);
        }
      } else {
        setError('Curso no encontrado');
      }
      setLoading(false);
    },
    [id]
  );

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch('/api/dashboard/catalog-categories');
        const j = await res.json();
        if (cancel || !res.ok) return;
        if (Array.isArray(j.items) && j.items.length > 0) {
          setCatalogOptions(
            j.items.map(
              (row: { slug: string; label: string }) => ({
                slug: row.slug,
                label: row.label,
              }),
            ),
          );
        }
      } catch {
        /* mantener PUBLIC_CATALOG_CATEGORIES_FALLBACK */
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    fetchCourse(true);
    return () => {
      if (publishPollRef.current) {
        window.clearInterval(publishPollRef.current);
      }
    };
  }, [fetchCourse]);

  async function handleFeaturedImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    setCoverUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/courses/${id}/featured-image`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details ?? data.error ?? 'No se pudo subir la imagen');
      }
      await fetchCourse(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCoverUploading(false);
    }
  }

  function addModule() {
    setEditContent((prev) => {
      if (!prev) return prev;
      const topics = [...(prev.topics ?? [])];
      topics.push(defaultTopic());
      return withTopics(prev, topics);
    });
  }

  function addLesson(topicIndex: number) {
    setEditContent((prev) => {
      if (!prev) return prev;
      const topics = prev.topics.map((t, i) =>
        i === topicIndex
          ? { ...t, lessons: [...(t.lessons ?? []), defaultLesson()] }
          : t
      );
      return withTopics(prev, topics);
    });
  }

  function removeModule(topicIndex: number) {
    setEditContent((prev) => {
      if (!prev || (prev.topics?.length ?? 0) <= 1) return prev;
      const topics = prev.topics.filter((_, i) => i !== topicIndex);
      return withTopics(prev, topics);
    });
  }

  function removeLesson(topicIndex: number, lessonIndex: number) {
    setEditContent((prev) => {
      if (!prev) return prev;
      const topic = prev.topics[topicIndex];
      if (!topic || topic.lessons.length <= 1) return prev;
      const nextLessons = topic.lessons.filter((_, i) => i !== lessonIndex);
      const topics = prev.topics.map((t, i) =>
        i === topicIndex ? { ...t, lessons: nextLessons } : t
      );
      return withTopics(prev, topics);
    });
  }

  async function handleSave() {
    if (!editContent) return;
    if (!editContent.topics?.length) {
      setError('Añade al menos un módulo.');
      return;
    }
    if (editContent.topics.some((t) => !(t.lessons?.length ?? 0))) {
      setError('Cada módulo necesita al menos una lección.');
      return;
    }
    const topicsNormalized = editContent.topics.map((t) => ({
      ...t,
      lessons: (t.lessons ?? []).map((L) => ({
        ...L,
        duration_minutes:
          typeof L.duration_minutes === 'number' && L.duration_minutes > 0
            ? Math.round(L.duration_minutes)
            : 15,
      })),
    }));
    const generated_content = withTopics(editContent, topicsNormalized);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generated_content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details ?? data.error ?? 'Error al guardar');
      setCourse(data);
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCatalogCategory(opts?: { inherit: boolean }) {
    if (!course) return;
    setCatalogSaving(true);
    setError(null);
    try {
      const inherit = opts?.inherit === true;
      const body = inherit
        ? { catalog_category: null }
        : { catalog_category: catalogPublicCategory };
      const res = await fetch(`/api/courses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details ?? data.error ?? 'Error al guardar categoría');
      setCourse(data);
      setCatalogPublicCategory(
        resolveCourseCatalogSlug(
          typeof data.catalog_category === 'string' ? data.catalog_category : null,
          data.input_payload,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCatalogSaving(false);
    }
  }

  async function handleSaveSeoPriority() {
    setSeoPrioritySaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seo_publish_priority: seoPublishPriority }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details ?? data.error ?? 'Error al guardar prioridad');
      setCourse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSeoPrioritySaving(false);
    }
  }

  async function handlePublish() {
    setSaving(true);
    setIsPublishing(true);
    setError(null);
    if (publishPollRef.current) {
      window.clearInterval(publishPollRef.current);
    }
    publishPollRef.current = window.setInterval(() => {
      fetchCourse(false).catch(() => {
        // Ignore transient polling errors
      });
    }, 1200);
    try {
      const res = await fetch('/api/publish-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: id,
          reviewsCount,
          reviewsAvgRating,
          reviewsPrompt: reviewsPrompt.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details ?? data.error ?? 'Error al publicar');
      setCourse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (publishPollRef.current) {
        window.clearInterval(publishPollRef.current);
        publishPollRef.current = null;
      }
      await fetchCourse(false);
      setIsPublishing(false);
      setSaving(false);
    }
  }

  async function handleRepublishWeb() {
    if (!course?.generated_content) return;
    setSaving(true);
    setError(null);
    const didRequestImageRegen = republishRegenImage;
    try {
      const res = await fetch('/api/publish-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: id,
          republish: true,
          regenerateFeaturedImage: republishRegenImage,
          regenerateReviews: republishRegenReviews,
          reviewsCount: republishRegenReviews ? reviewsCount : undefined,
          reviewsAvgRating: republishRegenReviews ? reviewsAvgRating : undefined,
          reviewsPrompt:
            republishRegenReviews && reviewsPrompt.trim()
              ? reviewsPrompt.trim()
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details ?? data.error ?? 'Error al republicar');
      }
      setCourse(data);
      await fetchCourse(false);
      setRepublishRegenImage(false);
      setRepublishRegenReviews(false);

      if (didRequestImageRegen && !data.featured_image_url?.trim()) {
        const log = typeof data.error_log === 'string' ? data.error_log : '';
        const line = log.split('\n').find((ln: string) => ln.includes('Portada fall'));
        setError(
          line
            ? `Portada: ${line.replace(/.*Portada falló:\s*/i, '').trim()}`
            : 'Pediste regenerar la portada pero no hay imagen en Storage. Revisa el log de publicación al final de la ficha y la clave GOOGLE_GEMINI_API_KEY en Vercel.',
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!course) return;
    const title = course.generated_content?.title ?? course.topic;
    if (!confirm(`¿Borrar el curso "${title}"? Esta acción no se puede deshacer.`)) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details ?? data.error ?? 'Error al borrar');
      }
      router.push('/dashboard/courses');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleExpandCourseContent() {
    const hasExpanded = Boolean(course?.expanded_at?.trim());
    if (hasExpanded) {
      const ok = window.confirm(
        'Esto sobreescribirá el contenido actual y puede tardar varios minutos. ¿Continuar?'
      );
      if (!ok) return;
    }

    setExpandGenerating(true);
    setExpandNotice(null);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${id}/expand`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === 'string'
            ? data.error
            : `Error ${res.status}: ${JSON.stringify(data)}`
        );
      }
      await fetchCourse(false);
      setExpandNotice({ kind: 'ok', text: 'Contenido generado correctamente' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setExpandNotice({ kind: 'err', text: msg });
    } finally {
      setExpandGenerating(false);
    }
  }

  async function handleGeneratePdf() {
    setPdfGenerating(true);
    setPdfProgress(0);
    setPdfTotal(0);
    setPdfLesson('Iniciando...');
    setPdfError(null);

    const abort = new AbortController();
    pdfAbortRef.current = abort;

    try {
      const res = await fetch(`/api/courses/${id}/course-pdf?stream=1`, {
        signal: abort.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error(`Error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const pdfChunks: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const line = part.replace(/^data:\s*/, '').trim();
          if (!line) continue;
          try {
            const ev = JSON.parse(line);
            if (ev.type === 'start') {
              setPdfTotal(ev.total);
            } else if (ev.type === 'progress') {
              setPdfProgress(ev.current);
              setPdfTotal(ev.total);
              setPdfLesson(ev.lesson);
            } else if (ev.type === 'pdf_chunk') {
              pdfChunks[ev.index] = ev.data;
              setPdfLesson('Recibiendo PDF...');
            } else if (ev.type === 'done') {
              setPdfLesson('Descargando...');
              const b64 = pdfChunks.join('');
              const bin = atob(b64);
              const bytes = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
              const blob = new Blob([bytes], { type: 'application/pdf' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = ev.filename || 'curso.pdf';
              document.body.appendChild(a);
              a.click();
              a.remove();
              setTimeout(() => URL.revokeObjectURL(url), 120_000);
            } else if (ev.type === 'error') {
              throw new Error(ev.message);
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setPdfError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setPdfGenerating(false);
      pdfAbortRef.current = null;
    }
  }

  if (loading) return <p className={styles.loading}>Cargando...</p>;
  if (error && !course) return <p className={styles.error}>{error}</p>;
  if (!course) return null;

  const content = editContent ?? course.generated_content;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Link href="/dashboard/courses" className={styles.back}>
          ← Volver
        </Link>
        <div className={styles.actions}>
          {editMode ? (
            <>
              <button onClick={() => setEditMode(false)} className={styles.btnSecondary}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className={styles.btnPrimary}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditMode(true)} className={styles.btnSecondary}>
                Editar
              </button>
              {course.status !== 'published' && (
                <>
                  <button onClick={handlePublish} disabled={saving} className={styles.btnPrimary}>
                    {saving ? 'Publicando...' : 'Publicar'}
                  </button>
                </>
              )}
              <button onClick={handleDelete} disabled={saving} className={styles.btnDanger}>
                Borrar
              </button>
            </>
          )}
        </div>
      </div>

      {!editMode && (
        <>
          <div className={styles.quizzesLinkCard}>
            <div className={styles.quizzesLinkInfo}>
              <h4 className={styles.quizzesLinkTitle}>Quizzes y examen final</h4>
              <p className={styles.quizzesLinkLead}>
                Genera con IA o crea manualmente los quizzes de cada módulo y el examen final
                (boss fight) para que los alumnos puedan obtener el diploma.
              </p>
            </div>
            <Link
              href={`/dashboard/courses/${id}/quizzes`}
              className={styles.quizzesLinkBtn}
            >
              Gestionar quizzes →
            </Link>
          </div>
          <PublishChecklist course={course} courseId={id} />
          <div className={styles.coverUploadCard}>
            <h4 className={styles.coverUploadTitle}>Portada</h4>
            <p className={styles.coverUploadLead}>
              Sube JPEG, PNG o WebP (máx. 6 MB). Al publicar, esta imagen se usa en el catálogo y en
              redes si no pides regenerar con Gemini; las <strong>reseñas</strong> siguen generándose
              con IA. Para volver a una portada hecha por Gemini más adelante, marca{' '}
              <strong>Regenerar portada con Gemini</strong> en «Web pública».
            </p>
            {course.featured_image_url ? (
              <div className={styles.coverPreviewWrap}>
                <img
                  src={course.featured_image_url}
                  alt=""
                  className={styles.coverPreviewImg}
                />
              </div>
            ) : null}
            <div className={styles.coverUploadRow}>
              <label className={`${styles.btnSecondary} ${styles.coverChooseBtn}`}>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className={styles.coverFileInputHidden}
                  disabled={coverUploading}
                  onChange={handleFeaturedImageUpload}
                  aria-busy={coverUploading}
                />
                <span>{coverUploading ? 'Subiendo…' : 'Elegir imagen'}</span>
              </label>
              {coverUploading ? (
                <span className={styles.coverUploadMuted}>Actualizando ficha…</span>
              ) : null}
            </div>
          </div>
        </>
      )}

      {!editMode && (
        <div className={styles.seoPriorityCard}>
          <h4 className={styles.seoPriorityTitle}>Prioridad cron del blog SEO</h4>
          <p className={styles.seoPriorityLead}>
            Número mayor = los próximos borradores SEO de este curso saldrán antes cuando el cron
            publique. Afecta sólo a posts generados después de cambiar esta prioridad y guardar.
          </p>
          <div className={styles.seoPriorityRow}>
            <input
              type="number"
              className={styles.hotmartInput}
              value={seoPublishPriority}
              onChange={(e) =>
                setSeoPublishPriority(
                  Math.min(10000, Math.max(-500, Number(e.target.value) || 0)),
                )
              }
            />
            <button
              type="button"
              className={styles.btnSecondary}
              disabled={seoPrioritySaving}
              onClick={() => handleSaveSeoPriority()}
            >
              {seoPrioritySaving ? 'Guardando...' : 'Guardar prioridad'}
            </button>
          </div>
        </div>
      )}

      {!editMode && (
        <div className={styles.seoPriorityCard}>
          <h4 className={styles.seoPriorityTitle}>Categoría en el catálogo web</h4>
          <p className={styles.seoPriorityLead}>
            Aparece en <code className={styles.inlineCode}>/cursos</code> para filtrar. Las
            categorías nuevas se añaden en el panel:{' '}
            <Link href="/dashboard/catalog-categories">Categorías /cursos</Link>. «Heredar tono»
            usa la vertical del generador de cursos (<code className={styles.inlineCode}>
              courseVertical
            </code>) solo como referencia.
          </p>
          <div className={styles.seoPriorityRow}>
            <select
              className={styles.selectInput}
              value={catalogPublicCategory}
              onChange={(e) => setCatalogPublicCategory(e.target.value)}
            >
              {catalogSelectOptions.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.btnSecondary}
              disabled={catalogSaving}
              onClick={() => handleSaveCatalogCategory()}
            >
              {catalogSaving ? 'Guardando…' : 'Guardar categoría'}
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              disabled={catalogSaving}
              onClick={() => handleSaveCatalogCategory({ inherit: true })}
            >
              Heredar del tono
            </button>
          </div>
        </div>
      )}

      {!editMode && (
        <div className={styles.reviewsConfig}>
          <h4 className={styles.reviewsConfigTitle}>
            {course.status !== 'published'
              ? 'Reseñas al publicar'
              : 'Opciones de reseñas (IA)'}
          </h4>
          <p className={styles.reviewsConfigLead}>
            {course.status !== 'published' ? (
              <>
                Las <strong>reseñas</strong> siempre se generan con IA. La <strong>portada</strong>: si ya
                subiste una imagen en «Portada» arriba, se usará esa; si no hay y Gemini está configurado,
                se intentará generar una automática al pulsar Publicar.
              </>
            ) : (
              <>
                Sirven cuando marcas <strong>Regenerar todas las reseñas</strong> más abajo, para
                sustituir el lote actual en Supabase con la misma configuración.
              </>
            )}
          </p>
          <div className={styles.reviewsConfigGrid}>
            <div className={styles.field}>
              <label>Cantidad de reseñas</label>
              <input
                type="number"
                min={5}
                max={200}
                value={reviewsCount}
                onChange={(e) => setReviewsCount(Math.max(5, Math.min(200, parseInt(e.target.value) || 50)))}
              />
            </div>
            <div className={styles.field}>
              <label>Valoración (perfil de estrellas)</label>
              <select
                value={reviewsAvgRating}
                onChange={(e) =>
                  setReviewsAvgRating(e.target.value as ReviewsRatingPreset)
                }
                className={styles.selectInput}
              >
                {REVIEWS_RATING_PRESET_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label>Instrucciones adicionales (opcional)</label>
            <textarea
              value={reviewsPrompt}
              onChange={(e) => setReviewsPrompt(e.target.value)}
              rows={3}
              placeholder="Ej: Enfoca las reseñas en la calidad del material práctico y en la atención del profesor. Incluye algunas reseñas que mencionen la relación calidad-precio."
            />
          </div>
        </div>
      )}

      {course.generated_content && !editMode && (
        <section
          id="web-publica"
          className={styles.republishPanel}
          aria-label="Página pública Recursalia"
        >
          <h4 className={styles.republishTitle}>Web pública (/cursos/…)</h4>
          <p className={styles.republishHint}>
            Republicar sincroniza título y metadescripciones desde el contenido generado o editado
            en Supabase para que los vea la web pública (/cursos/…) al momento.
            {course.status !== 'published'
              ? ' Si estás en borrador, también se activa estado publicado y se asigna el slug.'
              : ''}
          </p>
          <p className={styles.republishHint}>
            <strong>Opciones:</strong> marca lo que quieras regenerar y después pulsa el botón. La portada:
            solo se genera con Gemini si la marcas <em>y</em> hay API configurada; si antes subiste una
            imagen en «Portada», se conserva hasta que pidas regenerar.
          </p>
          <div className={styles.republishChecks}>
            <label>
              <input
                type="checkbox"
                checked={republishRegenImage}
                onChange={(e) => setRepublishRegenImage(e.target.checked)}
              />
              Regenerar portada con Gemini (sustituye la imagen actual si hay API; si tienes solo
              portada manual, conviene tenerla como copia antes)
            </label>
            <label>
              <input
                type="checkbox"
                checked={republishRegenReviews}
                onChange={(e) => setRepublishRegenReviews(e.target.checked)}
              />
              Regenerar todas las reseñas (usa cantidad y perfil de «Opciones de reseñas» arriba)
            </label>
          </div>
          <div className={styles.republishActions}>
            <button
              type="button"
              onClick={() => handleRepublishWeb()}
              disabled={saving}
              className={styles.btnPrimary}
            >
              {course.status === 'published'
                ? saving
                  ? 'Actualizando…'
                  : 'Actualizar página pública'
                : saving
                  ? 'Activando…'
                  : 'Activar página pública'}
            </button>
          </div>
        </section>
      )}

      {error && <p className={styles.errorMsg}>{error}</p>}

      <div className={styles.meta}>
        <span className={styles.badge}>{course.status}</span>
        <span className={styles.topic}>Tema: {course.topic}</span>
        <span className={styles.date}>
          {new Date(course.created_at).toLocaleString('es')}
        </span>
      </div>



      {course.public_slug && (
        <p className={styles.metaLine}>
          Web pública:{' '}
          <a href={`/cursos/${course.public_slug}`} target="_blank" rel="noopener noreferrer">
            /cursos/{course.public_slug}
          </a>
        </p>
      )}

      {!editMode && content && (
        <section className={styles.hotmartSection}>
          <div className={styles.hotmartCard}>
            <h3 className={styles.hotmartCardTitle}>Enlace de pago Hotmart</h3>
            <p className={styles.hotmartNote}>
              Crea el producto en Hotmart y pega aquí el enlace de pago; queda guardado en Supabase
              junto al curso.
            </p>
            <div className={styles.hotmartRow}>
              <input
                type="url"
                className={styles.hotmartInput}
                placeholder="https://pay.hotmart.com/..."
                value={hotmartLinkInput}
                onChange={(e) => setHotmartLinkInput(e.target.value)}
              />
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={savingHotmart || !hotmartLinkInput.trim()}
                onClick={async () => {
                  setSavingHotmart(true);
                  setError(null);
                  try {
                    const res = await fetch(`/api/courses/${id}/hotmart-link`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ url: hotmartLinkInput.trim() }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.details ?? data.error ?? 'Error al guardar');
                    setCourse(data);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : String(err));
                  } finally {
                    setSavingHotmart(false);
                  }
                }}
              >
                {savingHotmart ? 'Guardando...' : 'Guardar enlace'}
              </button>
            </div>
          </div>
          <div className={styles.hotmartCard}>
            <h3 className={styles.hotmartCardTitle}>Contenido del curso</h3>
            <p className={styles.hotmartNote}>
              Contenido extendido de cada lección. Necesario para el área de alumno en /aprender.
            </p>
            {course.expanded_at?.trim() ? (
              <p className={styles.hotmartNote}>
                <strong>Última generación:</strong> {formatExpandedRelative(course.expanded_at)}
              </p>
            ) : (
              <p className={styles.expandStatusMuted}>Sin generar</p>
            )}
            {expandNotice?.kind === 'ok' ? (
              <p className={styles.expandSuccess} role="status">
                {expandNotice.text}
              </p>
            ) : null}
            {expandNotice?.kind === 'err' ? (
              <p className={styles.pdfError} role="alert">
                {expandNotice.text}
              </p>
            ) : null}
            <button
              type="button"
              className={
                course.expanded_at?.trim()
                  ? styles.btnSecondary
                  : styles.btnPrimary
              }
              disabled={expandGenerating}
              onClick={() => void handleExpandCourseContent()}
            >
              {expandGenerating
                ? 'Generando contenido…'
                : course.expanded_at?.trim()
                  ? 'Regenerar contenido del curso'
                  : 'Generar contenido del curso'}
            </button>
            {course.expanded_at?.trim() ? (
              <p className={styles.hotmartNote} style={{ marginTop: '0.5rem' }}>
                Regenerar sobreescribe el contenido actual y puede tardar varios minutos.
              </p>
            ) : null}
            {expandGenerating ? (
              <p className={styles.expandWaitNote}>
                Esto puede tardar varios minutos. No cierres la página.
              </p>
            ) : null}
          </div>
          <CourseEnrollments
            courseId={id}
            learnUrl={
              course.public_slug ? `/aprender/cursos/${course.public_slug}` : null
            }
          />
          <div className={styles.hotmartCard}>
            <h3 className={styles.hotmartCardTitle}>Datos para copiar en Hotmart</h3>
            <p className={styles.hotmartNote}>
              Copia cada campo y pégalo en el formulario de Hotmart.
            </p>
            <div className={styles.copyRow}>
              <span className={styles.copyLabel}>Nombre</span>
              <span className={styles.copyValue}>{content.title}</span>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={() => navigator.clipboard.writeText(content.title)}
              >
                Copiar
              </button>
            </div>
            <div className={styles.copyRow}>
              <span className={styles.copyLabel}>Descripción</span>
              <span className={styles.copyValue}>
                {(() => {
                  const plain = (content.description ?? '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
                  return plain.length > 80 ? plain.slice(0, 80) + '...' : plain;
                })()}
              </span>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={() => {
                  const desc = (content.description ?? '')
                    .replace(/<\s*br\s*\/?>/gi, '\n')
                    .replace(/<\/p>/gi, '\n')
                    .replace(/<\/div>/gi, '\n')
                    .replace(/<\/li>/gi, '\n')
                    .replace(/<[^>]*>/g, '')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/\n{3,}/g, '\n\n')
                    .trim();
                  navigator.clipboard.writeText(desc);
                }}
              >
                Copiar
              </button>
            </div>
            <div className={styles.copyRow}>
              <span className={styles.copyLabel}>Precio ($)</span>
              <span className={styles.copyValue}>
                {content.price_sale ?? content.price_original ?? '—'}
              </span>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={() =>
                  navigator.clipboard.writeText(
                    String(content.price_sale ?? content.price_original ?? '')
                  )
                }
              >
                Copiar
              </button>
            </div>
            <a
              href="https://app.hotmart.com/products/add/4/info"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.hotmartLink}
            >
              Crear ebook en Hotmart →
            </a>
          </div>

          <div className={styles.hotmartCard}>
            <h3 className={styles.hotmartCardTitle}>Publicar en redes sociales</h3>
            <p className={styles.hotmartNote}>
              Publica en Facebook e Instagram de Recursalia a la vez. Se genera una imagen profesional con IA automaticamente.
            </p>
            <div className={styles.field}>
              <label>Texto del post (editable)</label>
              <textarea
                value={socialMessage || `${content.title}\n\n${content.short_description}\n\n#recursalia #cursosonline #formacion #educacion`}
                onChange={(e) => setSocialMessage(e.target.value)}
                rows={4}
                className={styles.socialTextarea}
              />
            </div>
            <button
              type="button"
              className={styles.socialBtnPublish}
              disabled={socialPosting !== null}
              onClick={async () => {
                setSocialPosting('facebook');
                setSocialResult(null);
                setSocialError(null);
                try {
                  const res = await fetch(`/api/courses/${id}/social-post`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      message: socialMessage || undefined,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.details ?? data.error);
                  const published = (data.published as string[]) ?? [];
                  const errs = (data.errors as string[]) ?? [];
                  if (published.length > 0) {
                    setSocialResult(`Publicado en ${published.join(' e ')}`);
                  }
                  if (errs.length > 0) {
                    setSocialError(errs.join(' | '));
                  }
                } catch (err) {
                  setSocialError(err instanceof Error ? err.message : String(err));
                } finally {
                  setSocialPosting(null);
                }
              }}
            >
              {socialPosting ? 'Publicando...' : 'Publicar en Facebook e Instagram'}
            </button>
            {socialResult && <p className={styles.socialSuccess}>{socialResult}</p>}
            {socialError && <p className={styles.pdfError}>{socialError}</p>}
          </div>
        </section>
      )}
      {course.error_log && (
        <p className={isPublishing ? styles.progressLog : styles.errorLog}>
          {course.error_log}
        </p>
      )}
      {isPublishing && !course.error_log && (
        <p className={styles.metaLine}>Iniciando publicacion...</p>
      )}

      {!content ? (
        <p className={styles.noContent}>Sin contenido generado.</p>
      ) : editMode ? (
        <div className={styles.editor}>
          <div className={styles.field}>
            <label>Título</label>
            <input
              value={editContent?.title ?? ''}
              onChange={(e) =>
                setEditContent((prev) =>
                  prev ? { ...prev, title: e.target.value } : prev
                )
              }
            />
          </div>
          <div className={styles.field}>
            <label>Descripción breve</label>
            <input
              value={editContent?.short_description ?? ''}
              onChange={(e) =>
                setEditContent((prev) =>
                  prev ? { ...prev, short_description: e.target.value } : prev
                )
              }
            />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Precio original ($)</label>
              <input
                type="number"
                value={editContent?.price_original ?? ''}
                onChange={(e) =>
                  setEditContent((prev) =>
                    prev
                      ? { ...prev, price_original: parseFloat(e.target.value) || undefined }
                      : prev
                  )
                }
              />
            </div>
            <div className={styles.field}>
              <label>Precio venta ($)</label>
              <input
                type="number"
                value={editContent?.price_sale ?? ''}
                onChange={(e) =>
                  setEditContent((prev) =>
                    prev
                      ? { ...prev, price_sale: parseFloat(e.target.value) || undefined }
                      : prev
                  )
                }
              />
            </div>
          </div>
          <div className={styles.field}>
            <label>Highlight / Salary info</label>
            <input
              value={editContent?.highlight ?? ''}
              onChange={(e) =>
                setEditContent((prev) =>
                  prev ? { ...prev, highlight: e.target.value } : prev
                )
              }
              placeholder="Ej: El salario medio es de 2700$"
            />
          </div>
          <div className={styles.field}>
            <label>Descripción (HTML)</label>
            <textarea
              value={editContent?.description ?? ''}
              onChange={(e) =>
                setEditContent((prev) =>
                  prev ? { ...prev, description: e.target.value } : prev
                )
              }
              rows={8}
            />
          </div>
          <div className={styles.topicsSection}>
            <div className={styles.topicsSectionHead}>
              <div>
                <h3>Módulos y lecciones</h3>
                {editContent ? (
                  <p className={styles.topicsDurationHint}>
                    Duración total estimada: {editContent.total_duration_minutes ?? 0} min
                  </p>
                ) : null}
              </div>
              <button type="button" className={styles.btnTopicAdd} onClick={addModule}>
                + Añadir módulo
              </button>
            </div>
            {!editContent?.topics || editContent.topics.length === 0 ? (
              <p className={styles.topicsEmpty}>No hay módulos. Pulsa «Añadir módulo» para crear el primero.</p>
            ) : null}
            {editContent?.topics?.map((topic, ti) => (
              <div key={ti} className={styles.topicBlock}>
                <div className={styles.topicHeaderRow}>
                  <input
                    value={topic.title}
                    onChange={(e) => {
                      const next = [...(editContent?.topics ?? [])];
                      next[ti] = { ...topic, title: e.target.value };
                      setEditContent((prev) => (prev ? withTopics(prev, next) : prev));
                    }}
                    className={styles.topicTitle}
                    placeholder="Título del módulo"
                  />
                  <div className={styles.topicActions}>
                    <button
                      type="button"
                      className={styles.btnTopicSecondary}
                      onClick={() => addLesson(ti)}
                    >
                      + Lección
                    </button>
                    {(editContent?.topics?.length ?? 0) > 1 ? (
                      <button
                        type="button"
                        className={styles.btnTopicDanger}
                        onClick={() => removeModule(ti)}
                      >
                        Eliminar módulo
                      </button>
                    ) : null}
                  </div>
                </div>
                {(topic.lessons ?? []).map((lesson, li) => (
                  <div key={li} className={styles.lessonBlock}>
                    <div className={styles.lessonTopRow}>
                      <input
                        value={lesson.title}
                        onChange={(e) => {
                          const nextTopics = [...(editContent?.topics ?? [])];
                          const nextLessons = [...(topic.lessons ?? [])];
                          nextLessons[li] = { ...lesson, title: e.target.value };
                          nextTopics[ti] = { ...topic, lessons: nextLessons };
                          setEditContent((prev) =>
                            prev ? withTopics(prev, nextTopics) : prev
                          );
                        }}
                        placeholder="Título lección"
                        className={styles.lessonTitle}
                      />
                      <label className={styles.lessonDurationLabel}>
                        Min
                        <input
                          type="number"
                          min={1}
                          max={600}
                          value={lesson.duration_minutes ?? 15}
                          onChange={(e) => {
                            const v = Math.max(
                              1,
                              Math.min(600, parseInt(e.target.value, 10) || 15)
                            );
                            const nextTopics = [...(editContent?.topics ?? [])];
                            const nextLessons = [...(topic.lessons ?? [])];
                            nextLessons[li] = { ...lesson, duration_minutes: v };
                            nextTopics[ti] = { ...topic, lessons: nextLessons };
                            setEditContent((prev) =>
                              prev ? withTopics(prev, nextTopics) : prev
                            );
                          }}
                          className={styles.lessonDurationInput}
                        />
                      </label>
                      {(topic.lessons ?? []).length > 1 ? (
                        <button
                          type="button"
                          className={styles.btnLessonRemove}
                          onClick={() => removeLesson(ti, li)}
                        >
                          Quitar lección
                        </button>
                      ) : null}
                    </div>
                    <textarea
                      value={lesson.content}
                      onChange={(e) => {
                        const nextTopics = [...(editContent?.topics ?? [])];
                        const nextLessons = [...(topic.lessons ?? [])];
                        nextLessons[li] = { ...lesson, content: e.target.value };
                        nextTopics[ti] = { ...topic, lessons: nextLessons };
                        setEditContent((prev) =>
                          prev ? withTopics(prev, nextTopics) : prev
                        );
                      }}
                      placeholder="Contenido HTML"
                      rows={4}
                      className={styles.lessonContent}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.view}>
          <h1>{content.title}</h1>
          <p className={styles.shortDesc}>{content.short_description}</p>
          {(content.price_original ?? content.price_sale) && (
            <p className={styles.prices}>
              {content.price_original && (
                <span className={styles.priceOriginal}>~~${content.price_original}~~</span>
              )}{' '}
              {content.price_sale && (
                <span className={styles.priceSale}>${content.price_sale}</span>
              )}
            </p>
          )}
          {content.highlight && (
            <p className={styles.highlight}>{content.highlight}</p>
          )}
          {content.benefits && content.benefits.length > 0 && (
            <div className={styles.benefits}>
              <h3>Ventajas</h3>
              <ul>
                {content.benefits.map((b, i) => (
                  <li key={i}>
                    <strong>{b.icon} {b.title}:</strong> {b.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: content.description }}
          />
          {content.topics?.map((topic, i) => (
            <div key={i} className={styles.topicView}>
              <h2>{topic.title}</h2>
              {topic.lessons.map((lesson, j) => (
                <div key={j} className={styles.lessonView}>
                  <h3>{lesson.title}</h3>
                  <div
                    dangerouslySetInnerHTML={{ __html: lesson.content }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
