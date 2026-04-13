'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './HomeHeroSearch.module.css';

type Result = {
  slug: string;
  title: string;
  subtitle: string;
  image: string | null;
};

export function HomeHeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fetchResults = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/public/course-search?q=${encodeURIComponent(query.trim())}`
      );
      const data = await res.json();
      setResults(Array.isArray(data.results) ? data.results : []);
      setActive(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchResults(q);
    }, 220);
    return () => clearTimeout(t);
  }, [q, fetchResults]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function goSlug(slug: string) {
    setOpen(false);
    router.push(`/cursos/${slug}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter') && results.length) {
      setOpen(true);
    }
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      goSlug(results[active].slug);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showDropdown = open && (loading || results.length > 0 || q.trim().length >= 2);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.inputShell}>
        <input
          id="home-course-search"
          className={styles.input}
          type="search"
          placeholder="Ej. Inteligencia artificial, diseño web…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />
        <button
          type="button"
          className={styles.searchBtn}
          aria-label="Buscar"
          onClick={() => {
            if (results[0]) goSlug(results[0].slug);
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      {showDropdown && (
        <div className={styles.dropdown}>
          {loading && <div className={styles.loading}>Buscando…</div>}
          {!loading &&
            results.map((r, i) => (
              <button
                key={r.slug}
                type="button"
                className={`${styles.item} ${i === active ? styles.itemActive : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => goSlug(r.slug)}
              >
                <div className={styles.thumb} />
                <div className={styles.meta}>
                  <span>{r.title}</span>
                  {r.subtitle ? <span>{r.subtitle}</span> : null}
                </div>
              </button>
            ))}
          {!loading && q.trim().length >= 2 && results.length === 0 && (
            <div className={styles.loading}>Sin resultados</div>
          )}
        </div>
      )}
    </div>
  );
}
