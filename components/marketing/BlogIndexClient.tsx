'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  categoryLabel,
  type CatalogCategoryPublic,
} from '@/lib/catalogCategory';
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

const UNCATEGORIZED_KEY = '__uncat__';
const UNCATEGORIZED_LABEL = 'Sin categoría';

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

  /**
   * Agrupa los posts filtrados por categoría, respetando el orden definido en
   * `categories` (sort_order de BD). Los posts sin categoría caen al final.
   */
  const grouped = useMemo(() => {
    const byCat = new Map<string, BlogIndexEntry[]>();
    for (const p of filtered) {
      const key = p.category ?? UNCATEGORIZED_KEY;
      const arr = byCat.get(key) ?? [];
      arr.push(p);
      byCat.set(key, arr);
    }
    const ordered: { slug: string; label: string; items: BlogIndexEntry[] }[] = [];
    for (const c of categories) {
      const items = byCat.get(c.slug);
      if (items && items.length > 0) {
        ordered.push({ slug: c.slug, label: c.label, items });
      }
    }
    const uncats = byCat.get(UNCATEGORIZED_KEY);
    if (uncats && uncats.length > 0) {
      ordered.push({
        slug: UNCATEGORIZED_KEY,
        label: UNCATEGORIZED_LABEL,
        items: uncats,
      });
    }
    return ordered;
  }, [filtered, categories]);

  /** Cuando hay categoría activa, ocultamos el heading del grupo (ya está en el chip + summary). */
  const showGroupHeadings = category === 'all';

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
        <div id="blog-results" className={styles.groups}>
          {grouped.map((group) => (
            <section key={group.slug} className={styles.group}>
              {showGroupHeadings ? (
                <header className={styles.groupHeader}>
                  <h2 className={styles.groupHeading}>{group.label}</h2>
                  <span className={styles.groupCount}>
                    {group.items.length} artículo
                    {group.items.length === 1 ? '' : 's'}
                  </span>
                </header>
              ) : null}
              <ul className={styles.list}>
                {group.items.map((p) => {
                  const dateLabel = formatDate(p.publishedAt);
                  return (
                    <li key={p.slug} className={styles.item}>
                      {dateLabel ? (
                        <p className={styles.itemMeta}>{dateLabel}</p>
                      ) : null}
                      <Link href={`/blog/${p.slug}`} className={styles.link}>
                        {qLower
                          ? highlightTerm(p.title, query.trim())
                          : p.title}
                      </Link>
                      {p.description ? (
                        <p className={styles.desc}>
                          {qLower
                            ? highlightTerm(p.description, query.trim())
                            : p.description}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
