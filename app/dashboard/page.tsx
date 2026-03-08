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

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

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

        <div className={styles.optionsSection}>
          <h4 className={styles.reviewsSectionTitle}>Opciones</h4>
          <div className={styles.optionsRow}>
            <div className={styles.field}>
              <label htmlFor="productType">Tipo de producto</label>
              <select
                id="productType"
                value={productType}
                onChange={(e) => setProductType(e.target.value as ProductType)}
              >
                <option value="course">Curso</option>
                <option value="guide">Guía / Manual</option>
              </select>
            </div>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={bestSeller}
                onChange={(e) => setBestSeller(e.target.checked)}
              />
              Best Seller
            </label>
          </div>
          <p className={styles.reviewsHint}>
            {productType === 'course'
              ? 'Curso: se mostrarán las ventajas del curso'
              : 'Guía / Manual: se mostrarán los beneficios del producto'}
          </p>
          <div className={styles.optionsRow}>
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
              <label htmlFor="lessonsPerTopic">Lecciones / módulo</label>
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
            <p className={styles.reviewsHint}>
              Total: {topicsCount * lessonsPerTopic} lecciones
            </p>
          </div>
        </div>

        <div className={styles.reviewsSection}>
          <h4 className={styles.reviewsSectionTitle}>Precio</h4>
          <div className={styles.priceRow}>
            <div className={styles.field}>
              <label htmlFor="price">Precio original ($)</label>
              <input
                id="price"
                type="number"
                min={1}
                step={1}
                value={price}
                onChange={(e) => setPrice(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={hasDiscount}
                onChange={(e) => setHasDiscount(e.target.checked)}
              />
              Descuento
            </label>
            {hasDiscount && (
              <div className={styles.field}>
                <label htmlFor="discountPercent">%</label>
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
                <span className={styles.priceOriginal}>${price}</span>
                <span className={styles.priceArrow}>&rarr;</span>
                <span className={styles.priceFinal}>
                  ${Math.round(price * (1 - discountPercent / 100))}
                </span>
                <span className={styles.priceSaving}>
                  (-{discountPercent}% = ahorras ${Math.round(price * discountPercent / 100)})
                </span>
              </>
            ) : (
              <span className={styles.priceFinal}>${price}</span>
            )}
          </div>
        </div>

        <div className={styles.reviewsSection}>
          <h4 className={styles.reviewsSectionTitle}>Reseñas</h4>
          <div className={styles.reviewsRow}>
            <div className={styles.field}>
              <label htmlFor="reviewsCount">Número de reseñas</label>
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
            <p className={styles.reviewsHint}>Se generarán al publicar el curso en WordPress (5-200)</p>
          </div>
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
