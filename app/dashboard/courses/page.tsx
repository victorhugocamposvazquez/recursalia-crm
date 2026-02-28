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
                <th></th>
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
                  <td>
                    <Link href={`/dashboard/courses/${c.id}`} className={styles.action}>
                      Ver / Editar
                    </Link>
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
