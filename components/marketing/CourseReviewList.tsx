'use client';

import { useState } from 'react';
import styles from './CourseReviewList.module.css';

export type ReviewRow = {
  id: string;
  title: string;
  content: string;
  rating: number;
  author_name: string;
  review_date: string;
};

const PAGE = 6;

export function CourseReviewList({ reviews }: { reviews: ReviewRow[] }) {
  const [n, setN] = useState(PAGE);
  const visible = reviews.slice(0, n);
  const hasMore = n < reviews.length;

  if (reviews.length === 0) {
    return <p className={styles.reviewMeta}>Sin opiniones todavía.</p>;
  }

  return (
    <>
      {visible.map((r) => (
        <article key={r.id} className={styles.reviewCard}>
          <h4>{r.title}</h4>
          <div className={styles.reviewMeta}>
            {r.rating}★ · {r.review_date} · {r.author_name}
          </div>
          <p>{r.content}</p>
        </article>
      ))}
      {hasMore && (
        <button type="button" className={styles.loadMore} onClick={() => setN((x) => x + PAGE)}>
          Cargar más
        </button>
      )}
    </>
  );
}
