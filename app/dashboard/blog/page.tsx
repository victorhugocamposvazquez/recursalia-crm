'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import styles from './blog-dashboard.module.css';

type Tab = 'draft' | 'published';

interface BlogPostRow {
  id: string;
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

export default function DashboardBlogPage() {
  const [tab, setTab] = useState<Tab>('draft');
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkLimit, setBulkLimit] = useState(10);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ ok?: string; err?: string }>({});
  const [forms, setForms] = useState<Record<string, FormFields>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setFlash({});
    try {
      const res = await fetch(`/api/blog/posts?status=${tab}&limit=200`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.details ?? data.error);
      const list = (data.posts ?? []) as BlogPostRow[];
      setPosts(list);
      const init: Record<string, FormFields> = {};
      for (const p of list) init[p.id] = toForm(p);
      setForms(init);
    } catch (e) {
      setPosts([]);
      setForms({});
      setFlash({ err: e instanceof Error ? e.message : String(e) });
    }
    setLoading(false);
  }, [tab]);

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
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details ?? data.error);
      setFlash({ ok: `Publicados ${data.published ?? 0} artículo(s).` });
      await load();
      setExpanded(null);
    } catch (e) {
      setFlash({ err: e instanceof Error ? e.message : String(e) });
    }
  }

  async function publishBulkPriority() {
    setFlash({});
    try {
      const res = await fetch('/api/blog/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: bulkLimit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details ?? data.error);
      setFlash({ ok: `Cola SEO: publicados ${data.published ?? 0} (prioridad → antiguo).` });
      await load();
    } catch (e) {
      setFlash({ err: e instanceof Error ? e.message : String(e) });
    }
  }

  const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Blog y SEO técnico</h1>
      <p className={styles.sub}>
        Ajusta título, slug (URL), meta descripción y HTML antes de publicar. Una URL estable y meta
        alineadas con la intención de búsqueda son las palancas con más impacto. El cron sigue sirviendo
        para automatizar la cola; aquí tienes control fino cuando quieras publicar ya.
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
          <span className={styles.bulkLabel}>
            Publicar por prioridad del curso (igual orden que el cron, sin esperar schedule):
          </span>
          <input
            className={styles.bulkNum}
            type="number"
            min={1}
            max={50}
            value={bulkLimit}
            onChange={(e) => setBulkLimit(parseInt(e.target.value, 10) || 1)}
          />
          <button type="button" className={styles.btnPrimary} onClick={() => void publishBulkPriority()}>
            Publicar ahora
          </button>
        </div>
      )}

      {flash.ok && <p className={styles.msgOk}>{flash.ok}</p>}
      {flash.err && <p className={styles.msgErr}>{flash.err}</p>}

      {loading ? (
        <p className={styles.muted}>Cargando…</p>
      ) : posts.length === 0 ? (
        <p className={styles.muted}>
          No hay entradas. Genera borradores en{' '}
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
                  <div>
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
