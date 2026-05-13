'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './reviews.module.css';
import type { CourseRecord, CourseReviewStored, GeneratedReview } from '@/types';
import type { ReviewsRatingPreset } from '@/lib/reviewsRatingPreset';
import { REVIEWS_RATING_PRESET_OPTIONS } from '@/lib/reviewsRatingPreset';

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ReviewsPage() {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState(50);
  const [reviewsAvgRating, setReviewsAvgRating] =
    useState<ReviewsRatingPreset>('high');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [reviews, setReviews] = useState<GeneratedReview[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [storedReviews, setStoredReviews] = useState<CourseReviewStored[]>([]);
  const [loadingStored, setLoadingStored] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualRating, setManualRating] = useState(5);
  const [manualDate, setManualDate] = useState(todayYmd);
  const [manualContent, setManualContent] = useState('');
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualNotice, setManualNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refreshStoredReviews = useCallback(async () => {
    if (!selectedCourseId.trim()) {
      setStoredReviews([]);
      return;
    }
    setLoadingStored(true);
    try {
      const res = await fetch(
        `/api/course-reviews?courseId=${encodeURIComponent(selectedCourseId)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details ?? data.error ?? 'Error al cargar reseñas');
      }
      setStoredReviews((data.reviews ?? []) as CourseReviewStored[]);
    } catch {
      setStoredReviews([]);
    } finally {
      setLoadingStored(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    async function fetchCourses() {
      const res = await fetch('/api/courses?limit=100');
      const data = await res.json();
      if (res.ok) {
        setCourses(data.courses ?? []);
        if (data.courses?.length) {
          setSelectedCourseId((prev) => prev || data.courses[0].id);
        }
      }
    }
    fetchCourses();
  }, []);

  useEffect(() => {
    void refreshStoredReviews();
  }, [refreshStoredReviews]);

  async function handleGenerate() {
    if (!selectedCourseId) {
      setError('Selecciona un curso');
      return;
    }
    setLoading(true);
    setError(null);
    setReviews([]);
    try {
      const res = await fetch('/api/generate-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourseId,
          prompt: prompt || undefined,
          count,
          reviewsAvgRating,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details ?? data.error ?? 'Error al generar');
      setReviews(data.reviews ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    if (!selectedCourseId || reviews.length === 0) {
      setError('Genera reseñas primero y selecciona un curso');
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch('/api/publish-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourseId,
          reviews,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details ?? data.error ?? 'Error al publicar');
      setError(null);
      alert(
        `Sustituidas las reseñas del curso por ${data.saved ?? data.total} generadas con IA.`,
      );
      await refreshStoredReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPublishing(false);
    }
  }

  async function handleManualSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourseId.trim()) {
      setManualError('Selecciona un curso');
      return;
    }
    setManualSaving(true);
    setManualError(null);
    setManualNotice(null);
    try {
      const res = await fetch('/api/course-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourseId,
          title: manualTitle.trim(),
          content: manualContent.trim(),
          author_name: manualAuthor.trim(),
          rating: manualRating,
          date: manualDate.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details ?? data.error ?? 'No se pudo guardar');
      }
      setManualNotice('Reseña guardada.');
      setManualTitle('');
      setManualContent('');
      setManualAuthor('');
      setManualRating(5);
      setManualDate(todayYmd());
      await refreshStoredReviews();
    } catch (err) {
      setManualError(err instanceof Error ? err.message : String(err));
    } finally {
      setManualSaving(false);
    }
  }

  async function handleDeleteReview(id: string) {
    if (!confirm('¿Eliminar esta reseña de Supabase?')) return;
    setDeletingId(id);
    setManualError(null);
    setManualNotice(null);
    try {
      const res = await fetch(`/api/course-reviews/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details ?? data.error ?? 'Error al eliminar');
      }
      await refreshStoredReviews();
    } catch (err) {
      setManualError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Reseñas de cursos</h1>
      <p className={styles.subtitle}>
        Genera lote con IA y sustituye todas las del curso, o añade reseñas manuales
        una a una (sin borrar las existentes).
      </p>

      <div className={styles.coursePicker}>
        <label htmlFor="reviews-course-global">Curso</label>
        <select
          id="reviews-course-global"
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
        >
          <option value="">— Seleccionar —</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.generated_content?.title ?? c.topic}
            </option>
          ))}
        </select>
      </div>

      <section className={styles.section} aria-labelledby="manual-heading">
        <h2 id="manual-heading" className={styles.sectionTitle}>
          Añadir reseña manual
        </h2>
        <p className={styles.sectionLead}>
          Se guarda en <code>course_reviews</code> y se muestra en la landing pública. No borra las
          reseñas que ya hubiera para ese curso.
        </p>
        <form className={styles.form} onSubmit={handleManualSave}>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="manual-title">Título</label>
              <input
                id="manual-title"
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                required
                maxLength={500}
                placeholder="Ej.: Claro y muy práctico"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="manual-author">Autor/a</label>
              <input
                id="manual-author"
                type="text"
                value={manualAuthor}
                onChange={(e) => setManualAuthor(e.target.value)}
                required
                maxLength={200}
                placeholder="Nombre visible público"
              />
            </div>
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="manual-rating">Valoración</label>
              <select
                id="manual-rating"
                value={manualRating}
                onChange={(e) => setManualRating(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'estrella' : 'estrellas'}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="manual-date">Fecha</label>
              <input
                id="manual-date"
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="manual-content">Texto de la opinión</label>
            <textarea
              id="manual-content"
              value={manualContent}
              onChange={(e) => setManualContent(e.target.value)}
              required
              rows={5}
              placeholder="Tu opinión tal como aparecerá en la ficha..."
            />
          </div>
          {manualError && <p className={styles.error}>{manualError}</p>}
          {manualNotice && <p className={styles.success}>{manualNotice}</p>}
          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={manualSaving || !selectedCourseId}
            >
              {manualSaving ? 'Guardando…' : 'Guardar reseña'}
            </button>
          </div>
        </form>

        <div className={styles.storedWrap}>
          <h3 className={styles.storedHeading}>
            En Supabase para este curso
            {loadingStored ? (
              <span className={styles.storedMuted}> · cargando…</span>
            ) : (
              <span className={styles.storedMuted}> ({storedReviews.length})</span>
            )}
          </h3>
          {storedReviews.length === 0 && !loadingStored ? (
            <p className={styles.storedEmpty}>No hay reseñas guardadas todavía.</p>
          ) : (
            <ul className={styles.storedList}>
              {storedReviews.map((r) => (
                <li key={r.id} className={styles.storedCard}>
                  <div className={styles.storedCardHead}>
                    <span className={styles.rating}>{'★'.repeat(r.rating)}</span>
                    <span className={styles.author}>{r.author_name}</span>
                    <span className={styles.date}>{r.review_date}</span>
                    <button
                      type="button"
                      className={styles.btnDelete}
                      aria-label={`Eliminar reseña: ${r.title}`}
                      disabled={deletingId === r.id}
                      onClick={() => handleDeleteReview(r.id)}
                    >
                      {deletingId === r.id ? '…' : 'Eliminar'}
                    </button>
                  </div>
                  <h4 className={styles.storedCardTitle}>{r.title}</h4>
                  <p className={styles.storedCardBody}>{r.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="ia-heading">
        <h2 id="ia-heading" className={styles.sectionTitle}>
          Generar reseñas con IA (lote)
        </h2>
        <p className={styles.sectionLeadDanger}>
          <strong>Importante:</strong> al usar «Guardar en Supabase» abajo sustituye{' '}
          <strong>todas</strong> las reseñas de ese curso por el lote generado (las manuales
          incluidas).
        </p>

        <div className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="ia-count">Número de reseñas</label>
            <input
              id="ia-count"
              type="number"
              min={1}
              max={200}
              value={count}
              onChange={(e) => setCount(Number(e.target.value) || 50)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="ia-preset">Valoración (perfil de estrellas)</label>
            <select
              id="ia-preset"
              value={reviewsAvgRating}
              onChange={(e) =>
                setReviewsAvgRating(e.target.value as ReviewsRatingPreset)
              }
            >
              {REVIEWS_RATING_PRESET_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="ia-prompt">Prompt personalizado (opcional)</label>
            <textarea
              id="ia-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Instrucciones extra para la IA. Ej: Tono más formal, enfatizar beneficios profesionales, incluir referencias a certificación..."
              rows={4}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className={styles.btnPrimary}
            >
              {loading ? 'Generando...' : 'Generar reseñas'}
            </button>
          </div>
        </div>

        {reviews.length > 0 && (
          <div className={styles.preview}>
            <h3>Vista previa ({reviews.length} reseñas)</h3>
            <div className={styles.reviewList}>
              {reviews.slice(0, 10).map((r, i) => (
                <div key={i} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <span className={styles.rating}>{'★'.repeat(r.rating)}</span>
                    <span className={styles.author}>{r.author_name}</span>
                    <span className={styles.date}>{r.date}</span>
                  </div>
                  <h4>{r.title}</h4>
                  <p>{r.content}</p>
                </div>
              ))}
            </div>
            {reviews.length > 10 && (
              <p className={styles.more}>+ {reviews.length - 10} más</p>
            )}
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className={styles.btnPublish}
            >
              {publishing
                ? 'Guardando...'
                : `Sustituir todo por estas ${reviews.length} reseñas (Supabase)`}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
