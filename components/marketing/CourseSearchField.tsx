'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CourseSearchField.module.css';

type Result = {
  slug: string;
  title: string;
  subtitle: string;
  image: string | null;
};

export type CourseSearchVariant = 'hero' | 'header';

type Props = {
  variant?: CourseSearchVariant;
  placeholder?: string;
  /** Variantes de texto cuando `heroTypingAccent` y hay varias desde el CMS. */
  typingPhrases?: string[];
  /** Solo home hero: texto en manuscrito con animación de “tipografía”. */
  heroTypingAccent?: boolean;
  /** id del input (accesibilidad); si no se pasa, se genera uno */
  inputId?: string;
  /** Ocupa todo el ancho del contenedor (p. ej. menú móvil) */
  fullWidth?: boolean;
};

export function CourseSearchField({
  variant = 'hero',
  placeholder = 'Encuentra tu recurso perfecto…',
  heroTypingAccent = false,
  typingPhrases,
  inputId: inputIdProp,
  fullWidth = false,
}: Props) {
  const router = useRouter();
  const genId = useId();
  const inputId = inputIdProp ?? `course-search-${genId}`;
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const qRef = useRef(q);
  qRef.current = q;
  const [typedHint, setTypedHint] = useState('');
  const phraseIxRef = useRef(0);

  const typingJoin = (typingPhrases ?? []).join('\u0000');

  const phrases = useMemo(() => {
    const fromProp = typingJoin
      .split('\u0000')
      .map((s) => s.trim())
      .filter(Boolean);
    if (fromProp.length > 0) return fromProp;
    const p = placeholder.trim();
    return p ? [p] : [];
  }, [typingJoin, placeholder]);

  const wrapClass = [
    styles.wrap,
    variant === 'header' ? styles.wrapHeader : styles.wrapHero,
    fullWidth ? styles.wrapFull : '',
  ]
    .filter(Boolean)
    .join(' ');

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

  useEffect(() => {
    if (!heroTypingAccent || variant !== 'hero') {
      setTypedHint('');
      return undefined;
    }
    phraseIxRef.current = 0;

    const phraseFirst = phrases[0]?.trim();
    if (!phraseFirst || phrases.length === 0) {
      setTypedHint('');
      return undefined;
    }
    if (q.trim()) {
      setTypedHint('');
      return undefined;
    }
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setTypedHint(phraseFirst);
      return undefined;
    }

    let active = true;
    let tid: number | undefined;

    function schedule(next: () => void, ms: number) {
      tid = window.setTimeout(() => {
        if (active && qRef.current.trim() === '') next();
      }, ms);
    }

    function step(charIndex: number) {
      if (!active || qRef.current.trim() !== '') return;
      const list = phrases;
      const phrase =
        list[phraseIxRef.current % list.length] ??
        '';

      if (charIndex < phrase.length) {
        setTypedHint(phrase.slice(0, charIndex + 1));
        schedule(() => step(charIndex + 1), 42);
      } else {
        schedule(() => {
          if (!active) return;
          setTypedHint('');
          phraseIxRef.current = (phraseIxRef.current + 1) % list.length;
          schedule(() => step(0), 580);
        }, 2550);
      }
    }

    schedule(() => step(0), 420);

    return () => {
      active = false;
      if (tid !== undefined) window.clearTimeout(tid);
    };
  }, [heroTypingAccent, variant, phrases, q]);

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

  const shellClass =
    variant === 'header' ? `${styles.inputShell} ${styles.inputShellHeader}` : styles.inputShell;

  const heroHandwriting = Boolean(heroTypingAccent && variant === 'hero');

  const inputCls = [
    styles.input,
    variant === 'header' ? styles.inputHeader : '',
    heroHandwriting ? styles.inputHero : '',
  ]
    .filter(Boolean)
    .join(' ');

  const sharedInputProps = {
    id: inputId,
    className: inputCls,
    type: 'search' as const,
    value: q,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setQ(e.target.value);
      setOpen(true);
    },
    onFocus: () => setOpen(true),
    onKeyDown,
    autoComplete: 'off' as const,
    ariaAutoComplete: 'list' as const,
    ariaExpanded: showDropdown,
  };

  return (
    <div className={wrapClass} ref={wrapRef}>
      <div className={shellClass}>
        <span className={styles.leadIcon} aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        {heroHandwriting ? (
          <div className={styles.inputGrow}>
            <input
              {...sharedInputProps}
              placeholder=""
              aria-label={
                phrases.length > 1
                  ? `Sugerencias: ${phrases.join('. ')}`
                  : placeholder
              }
            />
            {!q.trim() && typedHint ? (
              <span className={styles.heroTypingHint} aria-hidden>
                <span className={styles.heroTypingText}>{typedHint}</span>
                <span className={styles.heroCaret} />
              </span>
            ) : null}
          </div>
        ) : (
          <input {...sharedInputProps} placeholder={placeholder} />
        )}
        <button
          type="button"
          className={variant === 'header' ? `${styles.searchBtn} ${styles.searchBtnHeader}` : styles.searchBtn}
          aria-label="Buscar"
          onClick={() => {
            if (results[0]) goSlug(results[0].slug);
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
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
        <div
          className={
            variant === 'header' ? `${styles.dropdown} ${styles.dropdownHeader}` : styles.dropdown
          }
        >
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
