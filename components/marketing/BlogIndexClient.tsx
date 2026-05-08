'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  categoryLabel,
  type CatalogCategoryPublic,
} from '@/lib/catalogCategory';
import { COURSE_IMAGE_BLUR_DATA_URL } from '@/lib/imagePlaceholder';
import marketingStyles from '@/app/(marketing)/marketing.module.css';
import styles from '@/app/(marketing)/blog/blog.module.css';

export type BlogIndexEntry = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string | null;
  /** Slug de la categoría del curso al que pertenece el post (si aplica). */
  category: string | null;
  coursePublicSlug: string | null;
  imageUrl: string | null;
};

type Props = {
  posts: BlogIndexEntry[];
  categories: CatalogCategoryPublic[];
  initialCategory: string | 'all';
  initialQuery: string;
};

const SEARCH_DEBOUNCE_MS = 280;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightTerm(text: string, term: string) {
  const t = term.trim();
  if (!t) return text;
  const re = new RegExp(`(${escapeRegExp(t)})`, 'ig');
  const parts = text.split(re);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className={styles.markHit}>
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return null;
  }
}

function syncSearchParams(cat: string | 'all', q: string) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams();
  const qt = q.trim();
  if (qt) sp.set('q', qt);
  if (cat !== 'all') sp.set('cat', cat);
  const qs = sp.toString();
  const path = qs ? `/blog?${qs}` : '/blog';
  window.history.replaceState(null, '', path);
}

export function BlogIndexClient({
  posts,
  categories,
  initialCategory,
  initialQuery,
}: Props) {
  const slugSet = useMemo(
    () => new Set(categories.map((c) => c.slug)),
    [categories]
  );

  const [category, setCategory] = useState<string | 'all'>(initialCategory);
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  /* Debounce del input. */
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setQuery(queryInput);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [queryInput]);

  /* Sync URL. */
  useEffect(() => {
    if (!hydrated) return;
    syncSearchParams(category, query);
  }, [hydrated, category, query]);

  /* Si la categoría activa desaparece de la lista, resetea. */
  useEffect(() => {
    setCategory((prev) => (prev === 'all' || slugSet.has(prev) ? prev : 'all'));
  }, [slugSet]);

  const totalPosts = posts.length;

  const countsByCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of posts) {
      if (!p.category) continue;
      m.set(p.category, (m.get(p.category) ?? 0) + 1);
    }
    return m;
  }, [posts]);

  const qLower = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    let list = posts;
    if (category !== 'all') {
      list = list.filter((p) => p.category === category);
    }
    if (qLower) {
      list = list.filter((p) => {
        const t = p.title.toLowerCase();
        const d = (p.description || '').toLowerCase();
        return t.includes(qLower) || d.includes(qLower);
      });
    }
    return list;
  }, [posts, category, qLower]);

  const activeFilters = Boolean(query.trim()) || category !== 'all';

  const clearFilters = useCallback(() => {
    setCategory('all');
    setQueryInput('');
    setQuery('');
  }, []);

  const currentLabel =
    category === 'all'
      ? 'Todas las categorías'
      : categoryLabel(category, categories);

  if (totalPosts === 0) {
    return (
      <p className={marketingStyles.empty}>
        No hay artículos publicados todavía. Vuelve pronto: estamos preparando
        nuevas guías.
      </p>
    );
  }

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.searchField}>
          <label htmlFor="blog-search" className={styles.searchLabel}>
            Buscar en el blog
          </label>
          <div className={styles.searchInputWrap}>
            <svg
              className={styles.searchIcon}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              id="blog-search"
              type="search"
              className={styles.searchInput}
              placeholder="Busca por título o tema…"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              autoComplete="off"
              aria-controls="blog-results"
            />
            {queryInput ? (
              <button
                type="button"
                className={styles.searchClear}
                onClick={() => {
                  setQueryInput('');
                  setQuery('');
                }}
                aria-label="Limpiar búsqueda"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={styles.chips}
        role="group"
        aria-label="Filtrar artículos por categoría"
      >
        <button
          type="button"
          className={`${styles.chip} ${category === 'all' ? styles.chipActive : ''}`}
          aria-pressed={category === 'all'}
          onClick={() => setCategory('all')}
        >
          Todas
          <span className={styles.chipCount}>{totalPosts}</span>
        </button>
        {categories.map((c) => {
          const count = countsByCategory.get(c.slug) ?? 0;
          if (count === 0) return null;
          const active = category === c.slug;
          return (
            <button
              key={c.slug}
              type="button"
              className={`${styles.chip} ${active ? styles.chipActive : ''}`}
              aria-pressed={active}
              onClick={() => setCategory(c.slug)}
            >
              {c.label}
              <span className={styles.chipCount}>{count}</span>
            </button>
          );
        })}
      </div>

      <p
        className={styles.summary}
        aria-live="polite"
        aria-atomic="true"
      >
        {category !== 'all' ? <span>{currentLabel} · </span> : null}
        <span>
          {filtered.length} artículo{filtered.length === 1 ? '' : 's'}
        </span>
        {totalPosts > filtered.length ? (
          <span>
            {' · '}
            {totalPosts} en total
          </span>
        ) : null}
        {activeFilters ? (
          <>
            {' · '}
            <button
              type="button"
              className={styles.clearBtn}
              onClick={clearFilters}
            >
              Quitar filtros
            </button>
          </>
        ) : null}
      </p>

      {filtered.length === 0 ? (
        <div className={styles.emptyBlock}>
          <p className={marketingStyles.empty}>
            {qLower && category !== 'all' ? (
              <>
                No encontramos artículos con &laquo;{query.trim()}&raquo; en{' '}
                <strong>{currentLabel}</strong>.
              </>
            ) : qLower ? (
              <>No encontramos artículos con &laquo;{query.trim()}&raquo;.</>
            ) : category !== 'all' ? (
              <>Aún no hay artículos en {currentLabel}.</>
            ) : (
              'Sin resultados.'
            )}
          </p>
          {activeFilters ? (
            <button
              type="button"
              className={styles.linkBtn}
              onClick={clearFilters}
            >
              Quitar todos los filtros
            </button>
          ) : null}
        </div>
      ) : (
        <ul id="blog-results" className={styles.grid}>
          {filtered.map((p, idx) => {
            const dateLabel = formatDate(p.publishedAt);
            const catLabel = p.category
              ? categoryLabel(p.category, categories)
              : null;
            return (
              <li key={p.slug} className={styles.card}>
                <Link href={`/blog/${p.slug}`} className={styles.cardLink}>
                  <div className={styles.cardImage}>
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt=""
                        fill
                        loading={idx < 3 ? 'eager' : 'lazy'}
                        placeholder="blur"
                        blurDataURL={COURSE_IMAGE_BLUR_DATA_URL}
                        sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : null}
                    {catLabel ? (
                      <span className={styles.cardCategory}>{catLabel}</span>
                    ) : null}
                  </div>
                  <div className={styles.cardBody}>
                    {dateLabel ? (
                      <p className={styles.cardMeta}>{dateLabel}</p>
                    ) : null}
                    <h2 className={styles.cardTitle}>
                      {qLower
                        ? highlightTerm(p.title, query.trim())
                        : p.title}
                    </h2>
                    {p.description ? (
                      <p className={styles.cardDesc}>
                        {qLower
                          ? highlightTerm(p.description, query.trim())
                          : p.description}
                      </p>
                    ) : null}
                    <span className={styles.cardArrow} aria-hidden>
                      Leer artículo
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14M13 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
