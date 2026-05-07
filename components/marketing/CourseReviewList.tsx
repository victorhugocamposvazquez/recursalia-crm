'use client';

import { useMemo, useState } from 'react';
import { StarRatingDisplay } from './StarRatingDisplay';
import styles from './CourseReviewList.module.css';

export type ReviewRow = {
  id: string;
  title: string;
  content: string;
  rating: number;
  author_name: string;
  review_date: string;
};

const PAGE = 8;

type SortKey = 'recent' | 'highest' | 'lowest';

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'recent', label: 'Más recientes' },
  { id: 'highest', label: 'Mejor puntuadas' },
  { id: 'lowest', label: 'Peor puntuadas' },
];

function formatReviewDate(iso: string): string {
  try {
    const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return iso;
  }
}

function formatScore(n: number): string {
  return n.toFixed(1).replace('.', ',');
}

type Props = {
  reviews: ReviewRow[];
  average: number | null;
};

export function CourseReviewList({ reviews, average }: Props) {
  const [n, setN] = useState(PAGE);
  const [filterStars, setFilterStars] = useState<number | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('recent');

  const distribution = useMemo(() => {
    const out = [0, 0, 0, 0, 0];
    for (const r of reviews) {
      const idx = Math.round(r.rating);
      if (idx >= 1 && idx <= 5) out[5 - idx] += 1;
    }
    return out;
  }, [reviews]);

  const filtered = useMemo(() => {
    let list = reviews;
    if (filterStars !== 'all') {
      list = list.filter((r) => Math.round(r.rating) === filterStars);
    }
    const arr = list.slice();
    switch (sort) {
      case 'highest':
        arr.sort((a, b) => b.rating - a.rating || a.review_date.localeCompare(b.review_date));
        break;
      case 'lowest':
        arr.sort((a, b) => a.rating - b.rating || a.review_date.localeCompare(b.review_date));
        break;
      case 'recent':
      default:
        arr.sort((a, b) => (b.review_date ?? '').localeCompare(a.review_date ?? ''));
    }
    return arr;
  }, [reviews, filterStars, sort]);

  const visible = filtered.slice(0, n);
  const hasMore = n < filtered.length;

  if (reviews.length === 0) {
    return (
      <>
        <h2 id="reviews-heading" className={styles.heading}>
          Opiniones
        </h2>
        <p className={styles.empty}>
          Aún no hay opiniones publicadas para este curso.
        </p>
      </>
    );
  }

  const avg = average ?? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  return (
    <>
      <h2 id="reviews-heading" className={styles.heading}>
        <span className={styles.headingPrefix}>Opiniones:</span>{' '}
        <span className={styles.headingScore}>{formatScore(avg)}</span>
        <StarRatingDisplay
          value={avg}
          className={styles.headingStars}
          ariaHidden
        />
        <span className={styles.headingCount}>({reviews.length})</span>
      </h2>

      <div className={styles.controlsRow}>
        <div
          className={styles.filterChips}
          role="group"
          aria-label="Filtrar opiniones por puntuación"
        >
          <button
            type="button"
            className={`${styles.starChip} ${filterStars === 'all' ? styles.starChipActive : ''}`}
            aria-pressed={filterStars === 'all'}
            onClick={() => {
              setFilterStars('all');
              setN(PAGE);
            }}
          >
            Todas <span className={styles.starChipCount}>{reviews.length}</span>
          </button>
          {[5, 4, 3, 2, 1].map((star, idx) => {
            const count = distribution[idx];
            const active = filterStars === star;
            return (
              <button
                key={star}
                type="button"
                className={`${styles.starChip} ${active ? styles.starChipActive : ''}`}
                aria-pressed={active}
                disabled={count === 0}
                onClick={() => {
                  setFilterStars(star);
                  setN(PAGE);
                }}
              >
                {star} ★ <span className={styles.starChipCount}>{count}</span>
              </button>
            );
          })}
        </div>
        <label className={styles.sortLabel}>
          <span className={styles.sortText}>Ordenar:</span>
          <select
            className={styles.sortSelect}
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setN(PAGE);
            }}
            aria-label="Ordenar opiniones"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <p className={styles.empty} role="status" aria-live="polite">
          No hay opiniones con este filtro.
        </p>
      ) : (
        <div className={styles.list} role="list">
          {visible.map((r) => (
            <article key={r.id} className={styles.item} role="listitem">
              <h3 className={styles.itemTitle}>{r.title}</h3>
              <div className={styles.itemMeta}>
                <StarRatingDisplay
                  value={r.rating}
                  ariaHidden
                  className={styles.compactStars}
                />
                <span className={styles.itemDate}>
                  {formatReviewDate(r.review_date)}
                </span>
              </div>
              <p className={styles.itemBody}>{r.content}</p>
              <p className={styles.itemAuthor}>{r.author_name}</p>
            </article>
          ))}
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          className={styles.loadMore}
          onClick={() => setN((x) => x + PAGE)}
        >
          Cargar más opiniones
        </button>
      )}
    </>
  );
}
