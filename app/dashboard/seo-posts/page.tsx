'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import styles from './seo-posts.module.css';
import type { CourseRecord, SeoPostRecord } from '@/types';
import { SEO_POST_SPECS_TOTAL } from '@/services/openaiSeoPostService';

interface GenerateResult {
  generated: number;
  saved_drafts: number;
  records: SeoPostRecord[];
  errors?: string[];
}

const POST_TYPE_LABELS: Record<string, string> = {
  intro: 'Introduccion',
  tutorial: 'Tutorial',
  listicle: 'Listicle',
  career: 'Carrera/Salarios',
  comparison: 'Comparativa',
  certification: 'Certificaciones',
  geo: 'Geolocalizado',
  ultimate_guide: 'Guia completa',
  review: 'Opinion',
};

export default function SeoPostsPage() {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTitle, setProgressTitle] = useState('');
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState('');

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/courses?status=published');
      const data = await res.json();
      if (res.ok) {
        setCourses(data.courses ?? []);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  /** Refresca KPIs tras generar/postear sin pantalla completa “Cargando”. */
  const refreshCoursesQuiet = useCallback(async () => {
    try {
      const res = await fetch('/api/courses?status=published');
      const data = await res.json();
      if (res.ok) setCourses(data.courses ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  const totalDrafts = courses.reduce(
    (acc, c) => acc + ((c as CourseRecord & { seo_posts_count?: number }).seo_posts_count ?? 0),
    0,
  );

  async function handleGenerate() {
    if (!selectedCourseId) return;
    setGenerating(true);
    setResult(null);
    setError('');
    setProgressCurrent(0);
    setProgressTitle('Iniciando generacion...');

    const progressInterval = setInterval(() => {
      setProgressCurrent((prev) => {
        if (prev >= SEO_POST_SPECS_TOTAL - 1) return prev;
        return prev + 1;
      });
    }, 6000);

    try {
      const res = await fetch(`/api/courses/${selectedCourseId}/seo-posts`, {
        method: 'POST',
      });
      const data = await res.json();

      clearInterval(progressInterval);

      if (!res.ok) {
        throw new Error(data.details ?? data.error ?? 'Error generando posts');
      }

      setProgressCurrent(SEO_POST_SPECS_TOTAL);
      setProgressTitle('Completado');
      setResult(data as GenerateResult);
      void refreshCoursesQuiet();
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setGenerating(false);
    }
  }

  async function handlePublishNow() {
    setPublishing(true);
    setPublishResult('');
    try {
      const res = await fetch('/api/blog/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 3 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details ?? data.error ?? 'Publish');
      setPublishResult(
        `Publicados ${data.published} posts (${(data.posts ?? []).length} slugs)`
      );
      void refreshCoursesQuiet();
    } catch (err) {
      setPublishResult(`Error: ${err instanceof Error ? err.message : 'desconocido'}`);
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return <div className={styles.page}><p className={styles.loading}>Cargando cursos...</p></div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Posts SEO</h1>
        <p className={styles.subtitle}>
          Genera <strong>{SEO_POST_SPECS_TOTAL}</strong> posts de blog SEO por curso para captar tráfico orgánico. El cron ordena borradores por la prioridad que configuras en la ficha del curso (valor más alto antes).
        </p>
        <p className={styles.note}>
          Gestiona borradores, URLs, meta y publicacion bajo demanda en{' '}
          <Link href="/dashboard/blog" className={styles.noteLink}>Blog (panel SEO)</Link>.
        </p>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Cursos publicados</p>
          <p className={styles.statValue}>{courses.length}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Entradas de blog ligadas</p>
          <p className={styles.statValueAccent}>{totalDrafts}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Pack por curso</p>
          <p className={styles.statValue}>{SEO_POST_SPECS_TOTAL}</p>
        </div>
      </div>

      {/* Generate section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Generar posts para un curso</h2>
        {courses.length === 0 ? (
          <div className={styles.empty}>
            <p>No hay cursos publicados.</p>
            <Link href="/dashboard" className={styles.link}>
              Genera tu primer curso
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.selectRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Selecciona un curso</label>
                <select
                  className={styles.select}
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    setResult(null);
                    setError('');
                  }}
                  disabled={generating}
                >
                  <option value="">-- Elige un curso --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.generated_content?.title ?? c.topic}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className={styles.generateBtn}
                onClick={handleGenerate}
                disabled={!selectedCourseId || generating}
              >
                {generating ? 'Generando...' : `Generar ${SEO_POST_SPECS_TOTAL} posts`}
              </button>
            </div>

            {selectedCourse && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
                Tema: {selectedCourse.topic}
              </p>
            )}

            {/* Progress */}
            {generating && (
              <div className={styles.progress}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${(progressCurrent / SEO_POST_SPECS_TOTAL) * 100}%` }}
                  />
                </div>
                <p className={styles.progressText}>
                  {progressCurrent}/{SEO_POST_SPECS_TOTAL} — {progressTitle}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Alert */}
      {error && (
        <div className={styles.alertError}>{error}</div>
      )}

      {/* Results */}
      {result && (
        <div className={styles.section}>
          <h2 className={styles.logTitle}>
            Resultado: {result.saved_drafts} posts guardados como borrador en Supabase
          </h2>
          <ul className={styles.logList}>
            {result.records.map((r, idx) => (
              <li key={r.id ?? r.slug ?? `row-${idx}`} className={styles.logItem}>
                <span className={styles.logCheck}>✓</span>
                <span className={styles.logTitle2}>{r.title}</span>
                <span className={styles.logBadge}>
                  {POST_TYPE_LABELS[r.post_type] ?? r.post_type}
                </span>
              </li>
            ))}
          </ul>
          <div className={styles.publishCta}>
            <p className={styles.publishCtaText}>
              Hasta aquí solo son <strong>borradores</strong>: la web solo muestra entradas con estado{' '}
              <strong>publicado</strong>. Ve al panel Blog para revisar y publicarlos todos, de uno en uno,
              o en cola.
            </p>
            <Link href="/dashboard/blog" className={styles.publishCtaBtn}>
              Abrir Blog y publicar
            </Link>
          </div>
          {result.errors && result.errors.length > 0 && (
            <div className={styles.alertError} style={{ marginTop: '1rem' }}>
              <strong>Errores:</strong>
              <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Cron info */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Publicacion automatica</h2>
        <div className={styles.cronInfo}>
          <span className={styles.cronDot} />
          <p className={styles.cronText}>
            El cron puede publicar hasta <strong>3 borradores</strong> cada{' '}
            <strong>lunes, miercoles y viernes</strong> a las 9:00 UTC. El botón inferior hace{' '}
            <strong>lo mismo en miniatura</strong> (solo 3 de la cola por prioridad). Para ver todos tus
            borradores y publicar las <strong>{SEO_POST_SPECS_TOTAL} entradas generadas</strong> cuando quieras, usa{' '}
            <Link href="/dashboard/blog" className={styles.noteLink}>Blog</Link>.
          </p>
          <button
            type="button"
            className={styles.publishNowBtn}
            onClick={handlePublishNow}
            disabled={publishing}
          >
            {publishing ? 'Publicando...' : 'Publicar 3 (cola cron)'}
          </button>
        </div>
        {publishResult && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#94a3b8' }}>
            {publishResult}
          </p>
        )}
      </div>
    </div>
  );
}
