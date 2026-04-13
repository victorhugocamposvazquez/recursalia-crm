'use client';

import { useState } from 'react';
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
  const visible = reviews.slice(0, n);
  const hasMore = n < reviews.length;

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
              <span className={styles.itemDate}>{formatReviewDate(r.review_date)}</span>
            </div>
            <p className={styles.itemBody}>{r.content}</p>
            <p className={styles.itemAuthor}>{r.author_name}</p>
          </article>
        ))}
      </div>

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
