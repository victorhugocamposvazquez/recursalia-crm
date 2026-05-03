'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import styles from '../operations/operations.module.css';

type Row = {
  slug: string;
  label: string;
  sort_order: number;
  is_active: boolean;
};

export default function CatalogCategoriesPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState('');
  const [label, setLabel] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(500);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/catalog-categories');
      const j = await res.json();
      if (!res.ok) throw new Error(j.details ?? j.error ?? 'Error');
      setItems(Array.isArray(j.items) ? j.items : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/catalog-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          label,
          sort_order: sortOrder,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.details ?? j.error ?? 'Error al crear');
      setSlug('');
      setLabel('');
      setSortOrder(500);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(row: Row, active: boolean) {
    setError(null);
    try {
      const res = await fetch(
        `/api/dashboard/catalog-categories/${encodeURIComponent(row.slug)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: active }),
        }
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j.details ?? j.error ?? 'Error');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Categorías del catálogo</h1>
      <p className={styles.sub}>
        Aparecen en <Link href="/cursos">/cursos</Link> y en el desplegable de cada curso.
        Slug en minúsculas, letras, números y guiones (
        <code>economia</code>, <code>habilidades-blandas</code>). No se puede borrar una
        categoría si hay cursos asignados: desactívala y reasigna los cursos antes.
      </p>

      {error ? <p className={styles.error}>{error}</p> : null}

      <h2 className={styles.sectionTitle}>Añadir categoría</h2>
      <form onSubmit={handleCreate} className={styles.issueItem} style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'flex-end' }}>
          <div>
            <label className={styles.statLabel} htmlFor="cc-slug">
              Slug (URL)
            </label>
            <input
              id="cc-slug"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="ej. musica-produccion"
              style={{ padding: '0.45rem', minWidth: '12rem', display: 'block' }}
            />
          </div>
          <div>
            <label className={styles.statLabel} htmlFor="cc-label">
              Etiqueta visible
            </label>
            <input
              id="cc-label"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej. Música y producción"
              style={{ padding: '0.45rem', minWidth: '14rem', display: 'block' }}
            />
          </div>
          <div>
            <label className={styles.statLabel} htmlFor="cc-order">
              Orden
            </label>
            <input
              id="cc-order"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              style={{ padding: '0.45rem', width: '6rem', display: 'block' }}
            />
          </div>
          <button type="submit" disabled={creating} style={{ padding: '0.45rem 0.9rem' }}>
            {creating ? 'Creando…' : 'Crear'}
          </button>
        </div>
      </form>

      <h2 className={styles.sectionTitle}>Lista</h2>
      {loading ? (
        <p className={styles.muted}>Cargando…</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>Sin categorías.</p>
      ) : (
        <ul className={styles.issueList}>
          {items.map((r) => (
            <li key={r.slug} className={styles.issueItem}>
              <strong>{r.label}</strong>{' '}
              <span className={styles.badge}>{r.slug}</span>{' '}
              <span className={styles.badge}>orden {r.sort_order}</span>{' '}
              <span className={styles.badge}>{r.is_active ? 'activa' : 'inactiva'}</span>
              <div style={{ marginTop: '0.55rem' }}>
                {r.is_active ? (
                  <button
                    type="button"
                    className={styles.issueLink}
                    style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    onClick={() => toggleActive(r, false)}
                  >
                    Desactivar en web
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.issueLink}
                    style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    onClick={() => toggleActive(r, true)}
                  >
                    Activar en web
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
