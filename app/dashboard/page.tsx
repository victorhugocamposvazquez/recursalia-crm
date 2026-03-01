'use client';

import { useState } from 'react';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [avatar, setAvatar] = useState('');
  const [focus, setFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: string; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/generate-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, level, avatar, focus }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.details ?? data.error ?? 'Error al generar';
        throw new Error(msg);
      }
      setResult(data);
      setTopic('');
      setAvatar('');
      setFocus('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Generar nuevo curso</h1>
      <p className={styles.subtitle}>
        Define las directrices del curso. La IA generará la estructura completa.
      </p>

      <form onSubmit={handleGenerate} className={styles.form}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="topic">Tema del curso *</label>
            <input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej: React Hooks desde cero"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="level">Nivel</label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value as typeof level)}
            >
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="avatar">Avatar / Persona objetivo</label>
          <input
            id="avatar"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="Ej: Desarrollador junior que quiere aprender frontend"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="focus">Enfoque</label>
          <textarea
            id="focus"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="Ej: Enfoque práctico con proyectos reales, sin teoría innecesaria"
            rows={3}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {result && (
          <p className={styles.success}>
            Curso creado. <a href={`/dashboard/courses/${result.id}`}>Ver curso →</a>
          </p>
        )}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Generando...' : 'Generar curso'}
        </button>
      </form>
    </div>
  );
}
