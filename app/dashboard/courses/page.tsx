'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './courses.module.css';
import type { CourseRecord } from '@/types';

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/courses?${params}`);
      const data = await res.json();
      if (res.ok) {
        setCourses(data.courses ?? []);
        setTotal(data.total ?? 0);
      }
      setLoading(false);
    }
    fetchCourses();
  }, [statusFilter]);

  const statusBadge = (s: string) => {
    const cls =
      s === 'published'
        ? styles.badgePublished
        : s === 'error'
          ? styles.badgeError
          : styles.badgeDraft;
    return <span className={`${styles.badge} ${cls}`}>{s}</span>;
  };

  async function handleDelete(c: CourseRecord) {
    const title = c.generated_content?.title ?? c.topic;
    if (!confirm(`¿Borrar el curso "${title}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(c.id);
    try {
      const res = await fetch(`/api/courses/${c.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details ?? data.error ?? 'Error al borrar');
      }
      setCourses((prev) => prev.filter((x) => x.id !== c.id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al borrar');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mis cursos</h1>
        <div className={styles.filters}>
          <label>
            Estado:
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="error">Error</option>
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <p className={styles.loading}>Cargando...</p>
      ) : courses.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay cursos aún.</p>
          <Link href="/dashboard" className={styles.link}>
            Generar primer curso →
          </Link>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tema</th>
                <th>Título</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>{c.topic}</td>
                  <td>{c.generated_content?.title ?? '—'}</td>
                  <td>{statusBadge(c.status)}</td>
                  <td className={styles.date}>
                    {new Date(c.created_at).toLocaleDateString('es')}
                  </td>
                  <td className={styles.actionsCell}>
                    <Link href={`/dashboard/courses/${c.id}`} className={styles.action}>
                      Ver / Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
                      disabled={deletingId === c.id}
                      className={styles.deleteBtn}
                    >
                      {deletingId === c.id ? 'Borrando...' : 'Borrar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.total}>Total: {total} cursos</p>
        </div>
      )}
    </div>
  );
}
