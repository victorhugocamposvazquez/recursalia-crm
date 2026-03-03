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
  const publishPollRef = useRef<number | null>(null);

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
        body: JSON.stringify({ courseId: id }),
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
                <button onClick={handlePublish} disabled={saving} className={styles.btnPrimary}>
                  {saving ? 'Publicando...' : 'Publicar (WordPress + WooCommerce + Reseñas)'}
                </button>
              )}
              <button onClick={handleDelete} disabled={saving} className={styles.btnDanger}>
                Borrar
              </button>
            </>
          )}
        </div>
      </div>

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
              Descarga el PDF con todo el contenido del curso y súbelo en Hotmart en &quot;Contenido del producto&quot; (arrastrar o seleccionar archivo).
            </p>
            <a
              href={`/api/courses/${id}/course-pdf`}
              download
              className={styles.pdfDownloadBtn}
            >
              Descargar PDF del curso
            </a>
          </div>
          <div className={styles.hotmartCard}>
            <h3 className={styles.hotmartCardTitle}>Datos para copiar en Hotmart</h3>
            <p className={styles.hotmartNote}>
              Copia cada campo y pégalo al crear el producto en Hotmart para ir más rápido.
            </p>
            <div className={styles.copyRow}>
              <span className={styles.copyLabel}>Título</span>
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
              <span className={styles.copyLabel}>Descripción breve</span>
              <span className={styles.copyValue}>{content.short_description || '—'}</span>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={() => navigator.clipboard.writeText(content.short_description ?? '')}
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
              Crear ebook en Hotmart (información básica) →
            </a>
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
