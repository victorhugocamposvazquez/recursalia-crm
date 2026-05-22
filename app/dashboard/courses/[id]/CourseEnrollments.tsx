'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './course-detail.module.css';

type Enrollment = {
  user_id: string;
  email: string;
  enrolled_at: string;
  completed_at: string | null;
};

export function CourseEnrollments({
  courseId,
  learnUrl,
}: {
  courseId: string;
  learnUrl: string | null;
}) {
  const [email, setEmail] = useState('');
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/enrollments`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al cargar matriculados');
      setRows(data.enrollments ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo matricular');
      setMessage(`Matriculado: ${email}`);
      setEmail('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.hotmartCard}>
      <h3 className={styles.hotmartCardTitle}>Acceso alumnos (LMS)</h3>
      <p className={styles.hotmartCardHint}>
        Matricula manualmente tras la compra en Hotmart. El alumno debe tener cuenta (
        <code>/login</code>). Tras matricular, accede en{' '}
        {learnUrl ? (
          <a href={learnUrl} target="_blank" rel="noreferrer">
            {learnUrl}
          </a>
        ) : (
          '/aprender/cursos/[slug]'
        )}
        .
      </p>

      <form onSubmit={handleEnroll} className={styles.hotmartForm}>
        <label htmlFor="enroll-email">Email del alumno</label>
        <div className={styles.hotmartRow}>
          <input
            id="enroll-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alumno@email.com"
            required
          />
          <button type="submit" disabled={saving}>
            {saving ? 'Matriculando…' : 'Matricular'}
          </button>
        </div>
      </form>

      {message ? <p className={styles.expandOk}>{message}</p> : null}
      {error ? <p className={styles.pdfError}>{error}</p> : null}

      <h4 className={styles.checklistTitle} style={{ marginTop: 20 }}>
        Matriculados
      </h4>
      {loading ? (
        <p className={styles.hotmartCardHint}>Cargando…</p>
      ) : rows.length === 0 ? (
        <p className={styles.hotmartCardHint}>Nadie matriculado aún.</p>
      ) : (
        <ul className={styles.checklistList}>
          {rows.map((r) => (
            <li key={r.user_id} className={styles.checklistItem}>
              <span>{r.email}</span>
              <span className={styles.checklistHint}>
                {new Date(r.enrolled_at).toLocaleDateString('es-ES')}
                {r.completed_at ? ' · completado' : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
