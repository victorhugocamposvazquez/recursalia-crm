'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FrontCategoryRow } from '@/lib/front-site-data';
import type { FrontSearchCopy } from '@/types';
import styles from './front.module.css';

function sortRows(rows: FrontCategoryRow[]): FrontCategoryRow[] {
  return [...rows].sort((a, b) => a.sort_order - b.sort_order);
}

export default function FrontContentPage() {
  const [categories, setCategories] = useState<FrontCategoryRow[]>([]);
  const [searchCopy, setSearchCopy] = useState<FrontSearchCopy>({
    hero: '',
    header: '',
    drawer: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/front-site');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al cargar');
      setCategories(sortRows(data.categories ?? []));
      setSearchCopy(data.searchCopy);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function updateField(id: string, patch: Partial<FrontCategoryRow>) {
    setCategories((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function move(id: string, dir: -1 | 1) {
    setCategories((prev) => {
      const sorted = sortRows(prev);
      const idx = sorted.findIndex((r) => r.id === id);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= sorted.length) return prev;
      const a = sorted[idx];
      const b = sorted[j];
      return prev.map((row) => {
        if (row.id === a.id) return { ...row, sort_order: b.sort_order };
        if (row.id === b.id) return { ...row, sort_order: a.sort_order };
        return row;
      });
    });
  }

  function addCategory() {
    const maxOrder = categories.reduce((m, c) => Math.max(m, c.sort_order), -1);
    const row: FrontCategoryRow = {
      id: crypto.randomUUID(),
      label: 'Nueva categoría',
      query_q: 'nuevo',
      sort_order: maxOrder + 1,
      is_active: true,
    };
    setCategories((prev) => [...prev, row]);
  }

  function removeById(id: string) {
    if (categories.length <= 1) {
      setError('Debe quedar al menos una categoría.');
      return;
    }
    setError(null);
    setCategories((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const sorted = sortRows(categories);
    const normalized = sorted.map((c, i) => ({ ...c, sort_order: i }));
    try {
      const res = await fetch('/api/front-site', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: normalized,
          searchCopy,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar');
      setCategories(sortRows(data.categories ?? normalized));
      setSearchCopy(data.searchCopy ?? searchCopy);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  const sorted = sortRows(categories);

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Cargando…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Contenido del sitio (Front web)</h1>
      <p className={styles.subtitle}>
        Edita las categorías del menú «Categorías», activa o desactiva entradas y los textos de los
        buscadores (cabecera, hero y menú móvil). Los cambios se reflejan en la web pública al
        guardar.
      </p>

      {error ? <p className={styles.error}>{error}</p> : null}

      <section className={styles.section} aria-labelledby="copy-title">
        <h2 id="copy-title" className={styles.sectionTitle}>
          Textos de búsqueda
        </h2>
        <div className={styles.field}>
          <label htmlFor="ph-hero">Hero (página principal)</label>
          <input
            id="ph-hero"
            value={searchCopy.hero}
            onChange={(e) => setSearchCopy((s) => ({ ...s, hero: e.target.value }))}
          />
          <p className={styles.fieldHint}>Buscador principal bajo el titular.</p>
        </div>
        <div className={styles.field}>
          <label htmlFor="ph-header">Cabecera</label>
          <input
            id="ph-header"
            value={searchCopy.header}
            onChange={(e) => setSearchCopy((s) => ({ ...s, header: e.target.value }))}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="ph-drawer">Menú móvil (drawer)</label>
          <input
            id="ph-drawer"
            value={searchCopy.drawer}
            onChange={(e) => setSearchCopy((s) => ({ ...s, drawer: e.target.value }))}
          />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="cat-title">
        <h2 id="cat-title" className={styles.sectionTitle}>
          Categorías del menú
        </h2>
        <p className={styles.fieldHint}>
          Solo se muestran en la web las categorías activas. El término «búsqueda» alimenta el query{' '}
          <code>?q=</code> en el catálogo.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Orden</th>
                <th>Visible</th>
                <th>Etiqueta</th>
                <th>Búsqueda (q)</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, index) => (
                <tr key={row.id}>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        aria-label="Subir"
                        disabled={index === 0}
                        onClick={() => move(row.id, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        aria-label="Bajar"
                        disabled={index === sorted.length - 1}
                        onClick={() => move(row.id, 1)}
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={row.is_active}
                      onChange={(e) => updateField(row.id, { is_active: e.target.checked })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => updateField(row.id, { label: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.query_q}
                      onChange={(e) => updateField(row.id, { query_q: e.target.value })}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.danger}`}
                      aria-label="Eliminar fila"
                      onClick={() => removeById(row.id)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.addRow}>
          <button type="button" className={styles.addBtn} onClick={addCategory}>
            + Añadir categoría
          </button>
        </div>
      </section>

      <div className={styles.actions}>
        <button type="button" className={styles.saveBtn} disabled={saving} onClick={() => void handleSave()}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
