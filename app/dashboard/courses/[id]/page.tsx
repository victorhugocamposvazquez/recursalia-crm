'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './course-detail.module.css';
import type { CourseRecord, GeneratedCourseStructure } from '@/types';

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
  const [reviewsAvgRating, setReviewsAvgRating] = useState<'high' | 'mixed'>('high');
  const [reviewsPrompt, setReviewsPrompt] = useState('');
  const [showReviewsConfig, setShowReviewsConfig] = useState(false);
  const [socialPosting, setSocialPosting] = useState<'facebook' | 'instagram' | null>(null);
  const [socialMessage, setSocialMessage] = useState('');
  const [socialResult, setSocialResult] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);
  const publishPollRef = useRef<number | null>(null);
  const pdfAbortRef = useRef<AbortController | null>(null);

  const fetchCourse = useCallback(
    async (syncEditContent: boolean = false) => {
      const res = await fetch(`/api/courses/${id}`);
      const data = await res.json();
      if (res.ok) {
        setCourse(data);
        const link = data.hotmart_product_id;
        setHotmartLinkInput(typeof link === 'string' && link.startsWith('http') ? link : '');
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
    fetchCourse(true);
    return () => {
      if (publishPollRef.current) {
        window.clearInterval(publishPollRef.current);
      }
    };
  }, [fetchCourse]);

  async function handleSave() {
    if (!editContent) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generated_content: editContent }),
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
                  <button
                    onClick={() => setShowReviewsConfig((v) => !v)}
                    className={styles.btnSecondary}
                  >
                    Config reseñas
                  </button>
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

      {showReviewsConfig && course.status !== 'published' && (
        <div className={styles.reviewsConfig}>
          <h4 className={styles.reviewsConfigTitle}>Configuración de reseñas</h4>
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
              <label>Valoración media</label>
              <select
                value={reviewsAvgRating}
                onChange={(e) => setReviewsAvgRating(e.target.value as 'high' | 'mixed')}
                className={styles.selectInput}
              >
                <option value="high">Alta (4-5 estrellas, mayoría 5)</option>
                <option value="mixed">Mixta (3-5 estrellas, más variedad)</option>
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

      {error && <p className={styles.errorMsg}>{error}</p>}

      <div className={styles.meta}>
        <span className={styles.badge}>{course.status}</span>
        <span className={styles.topic}>Tema: {course.topic}</span>
        <span className={styles.date}>
          {new Date(course.created_at).toLocaleString('es')}
        </span>
      </div>

      {course.wp_course_id && (
        <p className={styles.metaLine}>WordPress ID: {course.wp_course_id}</p>
      )}

      {!editMode && course.wp_course_id && content && (
        <section className={styles.hotmartSection}>
          <div className={styles.hotmartCard}>
            <h3 className={styles.hotmartCardTitle}>Enlace de pago Hotmart</h3>
            <p className={styles.hotmartNote}>
              Crea el producto en Hotmart y pega aquí el enlace de pago; se guardará en el curso de WordPress.
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
                {savingHotmart ? 'Guardando...' : 'Guardar en WordPress'}
              </button>
            </div>
          </div>
          <div className={styles.hotmartCard}>
            <h3 className={styles.hotmartCardTitle}>PDF del curso (ebook)</h3>
            <p className={styles.hotmartNote}>
              Genera el ebook completo con contenido extenso para cada lección y súbelo en Hotmart en &quot;Contenido del producto&quot;.
            </p>
            {pdfGenerating ? (
              <div className={styles.pdfProgressWrap}>
                <div className={styles.pdfProgressBar}>
                  <div
                    className={styles.pdfProgressFill}
                    style={{ width: pdfTotal ? `${(pdfProgress / pdfTotal) * 100}%` : '0%' }}
                  />
                </div>
                <div className={styles.pdfProgressInfo}>
                  <span className={styles.pdfProgressLabel}>
                    {pdfProgress}/{pdfTotal} lecciones
                  </span>
                  <span className={styles.pdfProgressLesson}>{pdfLesson}</span>
                </div>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => pdfAbortRef.current?.abort()}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={styles.pdfDownloadBtn}
                onClick={handleGeneratePdf}
              >
                Generar y descargar PDF
              </button>
            )}
            {pdfError && <p className={styles.pdfError}>{pdfError}</p>}
          </div>
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
            <h3>Módulos y lecciones</h3>
            {editContent?.topics?.map((topic, ti) => (
              <div key={ti} className={styles.topicBlock}>
                <input
                  value={topic.title}
                  onChange={(e) => {
                    const next = [...(editContent?.topics ?? [])];
                    next[ti] = { ...topic, title: e.target.value };
                    setEditContent((prev) =>
                      prev ? { ...prev, topics: next } : prev
                    );
                  }}
                  className={styles.topicTitle}
                />
                {topic.lessons.map((lesson, li) => (
                  <div key={li} className={styles.lessonBlock}>
                    <input
                      value={lesson.title}
                      onChange={(e) => {
                        const nextTopics = [...(editContent?.topics ?? [])];
                        const nextLessons = [...topic.lessons];
                        nextLessons[li] = { ...lesson, title: e.target.value };
                        nextTopics[ti] = { ...topic, lessons: nextLessons };
                        setEditContent((prev) =>
                          prev ? { ...prev, topics: nextTopics } : prev
                        );
                      }}
                      placeholder="Título lección"
                      className={styles.lessonTitle}
                    />
                    <textarea
                      value={lesson.content}
                      onChange={(e) => {
                        const nextTopics = [...(editContent?.topics ?? [])];
                        const nextLessons = [...topic.lessons];
                        nextLessons[li] = { ...lesson, content: e.target.value };
                        nextTopics[ti] = { ...topic, lessons: nextLessons };
                        setEditContent((prev) =>
                          prev ? { ...prev, topics: nextTopics } : prev
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
