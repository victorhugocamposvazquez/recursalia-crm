'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { HOME_COURSE_CATEGORIES } from '@/lib/homeContent';
import styles from './HeaderCategories.module.css';

export function HeaderCategories() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', onKey);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        Categorías
        <span className={styles.chevron} aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open ? (
        <div className={styles.dropdown} role="menu">
          <ul className={styles.list}>
            {HOME_COURSE_CATEGORIES.map((c) => (
              <li key={c.q} role="none">
                <Link
                  href={`/cursos?q=${encodeURIComponent(c.q)}`}
                  className={styles.item}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.footer}>
            <Link href="/cursos" className={styles.allLink} onClick={() => setOpen(false)}>
              Ver todo el catálogo
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type DrawerCategoriesProps = {
  onNavigate?: () => void;
};

/** Lista de categorías en el drawer móvil (sin buscador). */
export function DrawerCategoriesSection({ onNavigate }: DrawerCategoriesProps) {
  const close = () => onNavigate?.();

  return (
    <div className={styles.drawerBlock}>
      <p className={styles.drawerTitle}>Categorías</p>
      <ul className={styles.drawerList}>
        {HOME_COURSE_CATEGORIES.map((c) => (
          <li key={c.q}>
            <Link
              href={`/cursos?q=${encodeURIComponent(c.q)}`}
              className={styles.drawerLink}
              onClick={close}
            >
              {c.label}
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/cursos" className={styles.drawerAll} onClick={close}>
        Ver todo el catálogo
      </Link>
    </div>
  );
}
