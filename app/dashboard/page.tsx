'use client';

import { useState } from 'react';
import type { ProductType } from '@/types';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [avatar, setAvatar] = useState('');
  const [focus, setFocus] = useState('');
  const [reviewsCount, setReviewsCount] = useState(50);
  const [bestSeller, setBestSeller] = useState(true);
  const [productType, setProductType] = useState<ProductType>('course');
  const [topicsCount, setTopicsCount] = useState(6);
  const [lessonsPerTopic, setLessonsPerTopic] = useState(4);
  const [price, setPrice] = useState(120);
  const [hasDiscount, setHasDiscount] = useState(true);
  const [discountPercent, setDiscountPercent] = useState(50);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: string; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const salePrice = Math.round(price * (1 - discountPercent / 100));

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    window.dispatchEvent(new CustomEvent('course-generating', { detail: true }));

    try {
      const res = await fetch('/api/generate-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic, level, avatar, focus, reviewsCount, bestSeller, productType,
          topicsCount, lessonsPerTopic, price,
          discountPercent: hasDiscount ? discountPercent : 0,
        }),
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
      window.dispatchEvent(new CustomEvent('course-generating', { detail: false }));
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Generar nuevo curso</h1>
      <p className={styles.subtitle}>
        Define las directrices y la IA generará la estructura completa.
      </p>

      <form onSubmit={handleGenerate} className={styles.form} data-course-form>
        {/* ── Tema ── */}
        <div className={styles.card}>
          <div className={styles.grid2}>
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
        </div>

        {/* ── Audiencia ── */}
        <div className={styles.card}>
          <div className={styles.field}>
            <label htmlFor="avatar">Avatar / Persona objetivo</label>
            <input
              id="avatar"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="Ej: Desarrollador junior que quiere aprender frontend"
            />
          </div>
          <div className={styles.field} style={{ marginTop: '0.75rem' }}>
            <label htmlFor="focus">Enfoque</label>
            <textarea
              id="focus"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Ej: Enfoque práctico con proyectos reales, sin teoría innecesaria"
              rows={3}
            />
          </div>
        </div>

        {/* ── Estructura ── */}
        <div className={styles.card}>
          <h4 className={styles.cardTitle}>Estructura</h4>
          <div className={styles.grid4}>
            <div className={styles.field}>
              <label htmlFor="productType">Tipo</label>
              <select
                id="productType"
                value={productType}
                onChange={(e) => setProductType(e.target.value as ProductType)}
              >
                <option value="course">Curso</option>
                <option value="guide">Guía / Manual</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="topicsCount">Módulos</label>
              <input
                id="topicsCount"
                type="number"
                min={2}
                max={15}
                value={topicsCount}
                onChange={(e) =>
                  setTopicsCount(Math.max(2, Math.min(15, parseInt(e.target.value) || 6)))
                }
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="lessonsPerTopic">Lecciones / mod.</label>
              <input
                id="lessonsPerTopic"
                type="number"
                min={1}
                max={10}
                value={lessonsPerTopic}
                onChange={(e) =>
                  setLessonsPerTopic(Math.max(1, Math.min(10, parseInt(e.target.value) || 4)))
                }
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="reviewsCount">Reseñas</label>
              <input
                id="reviewsCount"
                type="number"
                min={5}
                max={200}
                value={reviewsCount}
                onChange={(e) =>
                  setReviewsCount(Math.max(5, Math.min(200, parseInt(e.target.value) || 50)))
                }
              />
            </div>
          </div>
          <p className={styles.hint}>
            {topicsCount * lessonsPerTopic} lecciones &middot; {reviewsCount} reseñas
            {productType === 'course'
              ? ' &middot; Se mostrarán ventajas'
              : ' &middot; Se mostrarán beneficios'}
          </p>
          <label className={styles.toggle} style={{ marginTop: '0.75rem' }}>
            <input
              type="checkbox"
              checked={bestSeller}
              onChange={(e) => setBestSeller(e.target.checked)}
            />
            Marcar como Best Seller
          </label>
        </div>

        {/* ── Precio ── */}
        <div className={styles.card}>
          <h4 className={styles.cardTitle}>Precio</h4>
          <div className={styles.priceGrid}>
            <div className={styles.field}>
              <label htmlFor="price">Original ($)</label>
              <input
                id="price"
                type="number"
                min={1}
                step={1}
                value={price}
                onChange={(e) => setPrice(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={hasDiscount}
                onChange={(e) => setHasDiscount(e.target.checked)}
              />
              Descuento
            </label>
            {hasDiscount && (
              <div className={styles.field}>
                <label htmlFor="discountPercent">Porcentaje</label>
                <select
                  id="discountPercent"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseInt(e.target.value))}
                >
                  {[10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80].map((p) => (
                    <option key={p} value={p}>{p}%</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className={styles.priceCalc}>
            {hasDiscount ? (
              <>
                <span className={styles.priceOld}>${price}</span>
                <span className={styles.priceArrow}>&rarr;</span>
                <span className={styles.priceFinal}>${salePrice}</span>
                <span className={styles.priceSaving}>
                  ahorras ${price - salePrice} ({discountPercent}%)
                </span>
              </>
            ) : (
              <span className={styles.priceFinal}>${price}</span>
            )}
          </div>
        </div>

        {/* ── Feedback ── */}
        {error && <p className={styles.error}>{error}</p>}
        {result && (
          <p className={styles.success}>
            Curso generado correctamente. <a href={`/dashboard/courses/${result.id}`}>Ver curso &rarr;</a>
          </p>
        )}

        <button type="submit" disabled={loading} className={styles.submitBtn} style={{ display: 'none' }}>
          Generar curso
        </button>
      </form>
    </div>
  );
}
