'use client';

import { useEffect, useState } from 'react';
import styles from './reviews.module.css';
import type { CourseRecord } from '@/types';
import type { GeneratedReview } from '@/types';

export default function ReviewsPage() {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [reviews, setReviews] = useState<GeneratedReview[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      const res = await fetch('/api/courses?limit=100');
      const data = await res.json();
      if (res.ok) {
        setCourses(data.courses ?? []);
        if (data.courses?.length && !selectedCourseId) {
          setSelectedCourseId(data.courses[0].id);
        }
      }
    }
    fetchCourses();
  }, []);

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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al generar');
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
      if (!res.ok) throw new Error(data.error ?? 'Error al publicar');
      setError(null);
      alert(`Publicadas ${data.created} reseñas en Site Reviews`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPublishing(false);
    }
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const hasWpCourse = selectedCourse?.wp_course_id;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Generar reseñas con IA</h1>
      <p className={styles.subtitle}>
        Escribe un prompt personalizado, genera reseñas y publícalas en Site
        Reviews.
      </p>

      <div className={styles.form}>
        <div className={styles.field}>
          <label>Curso</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="">— Seleccionar —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.generated_content?.title ?? c.topic} {c.wp_course_id ? '✓ WP' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label>Número de reseñas</label>
          <input
            type="number"
            min={1}
            max={200}
            value={count}
            onChange={(e) => setCount(Number(e.target.value) || 50)}
          />
        </div>

        <div className={styles.field}>
          <label>Prompt personalizado (opcional)</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Instrucciones extra para la IA. Ej: Tono más formal, enfatizar beneficios profesionales, incluir referencias a certificación..."
            rows={4}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button
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
          <h2>Vista previa ({reviews.length} reseñas)</h2>
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
            onClick={handlePublish}
            disabled={publishing || !hasWpCourse}
            className={styles.btnPublish}
          >
            {publishing
              ? 'Publicando...'
              : hasWpCourse
                ? `Publicar ${reviews.length} reseñas a Site Reviews`
                : 'El curso debe estar publicado en WP primero'}
          </button>
        </div>
      )}
    </div>
  );
}
