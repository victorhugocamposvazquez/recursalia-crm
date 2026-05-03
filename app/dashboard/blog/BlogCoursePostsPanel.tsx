'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import styles from './blog-dashboard.module.css';

type Tab = 'draft' | 'published';

interface BlogPostRow {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  meta_description: string | null;
  content: string;
  post_type: string | null;
  status: Tab;
  tags: string[] | null;
  created_at: string;
  published_at: string | null;
  publish_priority?: number | null;
}

type FormFields = {
  title: string;
  slug: string;
  meta_description: string;
  content: string;
  tagsComma: string;
};

function toForm(p: BlogPostRow): FormFields {
  return {
    title: p.title,
    slug: p.slug,
    meta_description: p.meta_description ?? '',
    content: p.content,
    tagsComma: (p.tags ?? []).join(', '),
  };
}

type CourseBrief = {
  topic: string;
  displayTitle: string;
  public_slug: string | null;
};

export interface BlogCoursePostsPanelProps {
  courseId: string;
}

export function BlogCoursePostsPanel({ courseId }: BlogCoursePostsPanelProps) {
  const [tab, setTab] = useState<Tab>('draft');
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkLimit, setBulkLimit] = useState(18);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ ok?: string; err?: string }>({});
  const [forms, setForms] = useState<Record<string, FormFields>>({});
  const [courseBrief, setCourseBrief] = useState<CourseBrief | null>(null);
  const [courseMissing, setCourseMissing] = useState(false);
  const [headPending, setHeadPending] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelected(new Set());
  }, [tab]);

  const loadCourse = useCallback(async () => {
    setHeadPending(true);
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      if (!res.ok) {
        setCourseMissing(true);
        setCourseBrief(null);
        return;
      }
      const data = (await res.json()) as Record<string, unknown>;
      const topic = typeof data.topic === 'string' ? data.topic : '';
      const slug = typeof data.public_slug === 'string' ? data.public_slug : null;
      const gc = data.generated_content as { title?: string } | null;
      const t = gc?.title?.trim();
      setCourseBrief({
        topic,
        displayTitle: t || topic,
        public_slug: slug,
      });
      setCourseMissing(false);
    } catch {
      setCourseMissing(true);
      setCourseBrief(null);
    } finally {
      setHeadPending(false);
    }
  }, [courseId]);

  const load = useCallback(async () => {
    setLoading(true);
    setFlash({});
    try {
      const res = await fetch(
        `/api/blog/posts?status=${tab}&courseId=${encodeURIComponent(courseId)}&limit=300`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.details ?? data.error);
      const list = (data.posts ?? []) as BlogPostRow[];
      setPosts(list);
      const init: Record<string, FormFields> = {};
      for (const p of list) init[p.id] = toForm(p);
      setForms(init);
      setSelected((prev) => {
        const ids = new Set(list.map((p) => p.id));
        return new Set(Array.from(prev).filter((id) => ids.has(id)));
      });
    } catch (e) {
      setPosts([]);
      setForms({});
      setFlash({ err: e instanceof Error ? e.message : String(e) });
    }
    setLoading(false);
  }, [tab, courseId]);

  useEffect(() => {
    void loadCourse();
  }, [loadCourse]);

  useEffect(() => {
    void load();
  }, [load]);

  function setField(id: string, key: keyof FormFields, value: string) {
    setForms((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: value },
    }));
  }

  async function saveRow(id: string) {
    setFlash({});
    const f = forms[id];
    if (!f) return;
    const tags = f.tagsComma
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      const res = await fetch(`/api/blog/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: f.title,
          slug: f.slug,
          meta_description: f.meta_description || null,
          content: f.content,
          tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details ?? data.error);
      const updated = data.post as BlogPostRow;
      setPosts((list) => list.map((p) => (p.id === id ? updated : p)));
      setForms((prev) => ({ ...prev, [id]: toForm(updated) }));
      setFlash({ ok: 'Guardado.' });
    } catch (e) {
      setFlash({ err: e instanceof Error ? e.message : String(e) });
    }
  }

  async function publishIds(ids: string[]) {
    setFlash({});
    try {
      const res = await fetch('/api/blog/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, courseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details ?? data.error);
      setFlash({ ok: `Publicados ${data.published ?? 0} artículo(s).` });
      setSelected(new Set());
      await load();
      await loadCourse();
      setExpanded(null);
    } catch (e) {
      setFlash({ err: e instanceof Error ? e.message : String(e) });
    }
  }

  async function deleteSelected() {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (!confirm(`¿Eliminar ${ids.length} entrada(s)? Esta acción no se puede deshacer.`)) return;
    setFlash({});
    try {
      const res = await fetch('/api/blog/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, courseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details ?? data.error);
      setFlash({ ok: `Eliminadas ${data.deleted ?? 0} entrada(s).` });
      setSelected(new Set());
      setExpanded(null);
      await load();
      await loadCourse();
    } catch (e) {
      setFlash({ err: e instanceof Error ? e.message : String(e) });
    }
  }

  async function publishBulkForCourse() {
    setFlash({});
    try {
      const res = await fetch('/api/blog/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: bulkLimit, courseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details ?? data.error);
      setFlash({ ok: `Publicados ${data.published ?? 0} borrador(es) de este curso (cola por prioridad).` });
      await load();
      await loadCourse();
    } catch (e) {
      setFlash({ err: e instanceof Error ? e.message : String(e) });
    }
  }

  const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

  if (headPending) {
    return (
      <div className={styles.page}>
        <p className={styles.backRow}>
          <Link href="/dashboard/blog">← Todos los cursos</Link>
        </p>
        <p className={styles.muted}>Cargando curso…</p>
      </div>
    );
  }

  if (courseMissing || !courseBrief) {
    return (
      <div className={styles.page}>
        <p className={styles.backRow}>
          <Link href="/dashboard/blog">← Todos los cursos</Link>
        </p>
        <p className={styles.msgErr}>No se encontró el curso.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <p className={styles.backRow}>
        <Link href="/dashboard/blog">← Todos los cursos</Link>
      </p>

      <h1 className={styles.title}>Blog · {courseBrief.displayTitle}</h1>
      <div className={styles.courseHeaderMeta}>
        <span>Tema CRM: {courseBrief.topic}</span>
        {courseBrief.public_slug ? (
          <>
            {' · '}
            <Link href={`/cursos/${encodeURIComponent(courseBrief.public_slug)}`}>
              Landing pública
            </Link>
          </>
        ) : null}
        {' · '}
        <Link href={`/dashboard/courses/${courseId}`}>Ficha curso</Link>
      </div>

      <p className={styles.sub}>
        Entradas de blog SEO generadas desde este curso. Edita slug y meta antes de publicar.
        Aquí todos los comandos aplican{' '}
        <strong>solo a este curso</strong>.
      </p>

      <div className={styles.tabs}>
        <button
          type="button"
          className={tab === 'draft' ? styles.tabActive : styles.tab}
          onClick={() => setTab('draft')}
        >
          Borradores
        </button>
        <button
          type="button"
          className={tab === 'published' ? styles.tabActive : styles.tab}
          onClick={() => setTab('published')}
        >
          Publicados
        </button>
      </div>

      {tab === 'draft' && (
        <div className={styles.bulk}>
          <span className={styles.bulkLabel}>Publicar por prioridad solo de este curso:</span>
          <input
            className={styles.bulkNum}
            type="number"
            min={1}
            max={50}
            value={bulkLimit}
            onChange={(e) => setBulkLimit(parseInt(e.target.value, 10) || 1)}
          />
          <button type="button" className={styles.btnPrimary} onClick={() => void publishBulkForCourse()}>
            Publicar ahora (cola curso)
          </button>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className={styles.multiBar}>
          <span className={styles.multiMuted}>{selected.size} seleccionada(s)</span>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => setSelected(new Set(posts.map((p) => p.id)))}
          >
            Marcar visibles
          </button>
          <button type="button" className={styles.btnGhost} onClick={() => setSelected(new Set())}>
            Desmarcar
          </button>
          {tab === 'draft' && (
            <button
              type="button"
              className={styles.btnPrimary}
              disabled={selected.size === 0}
              onClick={() => void publishIds(Array.from(selected))}
            >
              Publicar seleccionados
            </button>
          )}
          <button
            type="button"
            className={styles.btnDanger}
            disabled={selected.size === 0}
            onClick={() => void deleteSelected()}
          >
            Eliminar seleccionadas
          </button>
        </div>
      )}

      {flash.ok && <p className={styles.msgOk}>{flash.ok}</p>}
      {flash.err && <p className={styles.msgErr}>{flash.err}</p>}

      {loading ? (
        <p className={styles.muted}>Cargando…</p>
      ) : posts.length === 0 ? (
        <p className={styles.muted}>
          No hay entradas para este estado. Genera desde{' '}
          <Link href="/dashboard/seo-posts">Posts SEO</Link>.
        </p>
      ) : (
        <div className={styles.list}>
          {posts.map((p) => {
            const f = forms[p.id];
            const open = expanded === p.id;
            const previewPath = `/blog/${p.slug}`;
            const previewAbs = siteOrigin ? `${siteOrigin}${previewPath}` : previewPath;

            return (
              <article key={p.id} className={styles.card}>
                <div className={styles.cardHead}>
                  <input
                    type="checkbox"
                    className={styles.rowChk}
                    checked={selected.has(p.id)}
                    onChange={() =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (next.has(p.id)) next.delete(p.id);
                        else next.add(p.id);
                        return next;
                      })
                    }
                    aria-label={`Seleccionar: ${p.title}`}
                  />
                  <div className={styles.cardHeadMain}>
                    <p className={styles.cardTitle}>{p.title}</p>
                    <p className={styles.slug}>/{p.slug}</p>
                  </div>
                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.btnGhost}
                      onClick={() => setExpanded(open ? null : p.id)}
                    >
                      {open ? 'Ocultar' : 'Editar SEO'}
                    </button>
                    {tab === 'draft' && (
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() => void publishIds([p.id])}
                      >
                        Publicar este
                      </button>
                    )}
                  </div>
                </div>
                {tab === 'published' && (
                  <p className={styles.previewLink}>
                    Vista:{' '}
                    <a href={previewAbs} target="_blank" rel="noreferrer">
                      {previewAbs}
                    </a>
                  </p>
                )}
                {open && f && (
                  <div className={styles.editor}>
                    <div className={styles.field}>
                      <label htmlFor={`title-${p.id}`}>Título (H1 y meta OG)</label>
                      <input
                        id={`title-${p.id}`}
                        value={f.title}
                        onChange={(e) => setField(p.id, 'title', e.target.value)}
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor={`slug-${p.id}`}>Slug (URL)</label>
                      <input
                        id={`slug-${p.id}`}
                        value={f.slug}
                        onChange={(e) => setField(p.id, 'slug', e.target.value)}
                        disabled={p.status === 'published'}
                      />
                      <p className={styles.hint}>
                        Solo editable en borrador. Tras publicar, cambiar slug rompería enlaces si no hay
                        redirección.
                      </p>
                    </div>
                    <div className={styles.field}>
                      <label htmlFor={`meta-${p.id}`}>Meta description (~150 caracteres recomendados)</label>
                      <textarea
                        id={`meta-${p.id}`}
                        rows={3}
                        value={f.meta_description}
                        onChange={(e) => setField(p.id, 'meta_description', e.target.value)}
                      />
                      <p className={styles.hint}>
                        Debe coincidir con la promesa del título para mejor CTR desde buscadores.
                      </p>
                    </div>
                    <div className={styles.field}>
                      <label htmlFor={`tags-${p.id}`}>Tags (separados por coma)</label>
                      <input
                        id={`tags-${p.id}`}
                        value={f.tagsComma}
                        onChange={(e) => setField(p.id, 'tagsComma', e.target.value)}
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor={`body-${p.id}`}>HTML del cuerpo</label>
                      <textarea
                        id={`body-${p.id}`}
                        value={f.content}
                        onChange={(e) => setField(p.id, 'content', e.target.value)}
                      />
                      <p className={styles.hint}>
                        Revisa jerarquía de encabezados: usa H2/H3 en el contenido; el sitio muestra ya un
                        H1 con el título del artículo.
                      </p>
                    </div>
                    <button type="button" className={styles.btnGhost} onClick={() => void saveRow(p.id)}>
                      Guardar cambios
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
