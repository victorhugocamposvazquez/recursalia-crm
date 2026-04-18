'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CourseSearchField } from '@/components/marketing/CourseSearchField';
import { DrawerCategoriesSection, HeaderCategories } from '@/components/marketing/HeaderCategories';
import styles from './SiteHeader.module.css';

export function SiteHeader() {
  const pathname = usePathname();
  const [sticky, setSticky] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY >= 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className={styles.header}>
      <div className={styles.outer}>
        <div className={styles.inner}>
          <nav className={`${styles.bar} ${sticky ? styles.barSticky : ''}`} aria-label="Principal">
            <Link href="/" className={styles.logo}>
              <span className={styles.logoMark} aria-hidden>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 2L21 7V17L12 22L3 17V7L12 2Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 10L12 12.5L17 10"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className={styles.logoText}>Recursalia</span>
            </Link>

            <div className={styles.headerSearch} role="search">
              <CourseSearchField
                variant="header"
                placeholder="¿Qué quieres aprender?"
                inputId="header-course-search"
              />
            </div>

            <div className={styles.navCluster}>
              <HeaderCategories />
              <Link
                href="/inspiracion"
                className={`${styles.inspiracionLink} ${pathname === '/inspiracion' ? styles.inspiracionLinkActive : ''}`}
              >
                Inspiración
              </Link>
            </div>

            <div className={styles.actions}>
              <Link href="/cursos" className={styles.cta}>
                <span className={styles.ctaLabel}>Recursos</span>
                <span className={styles.ctaBadge} aria-hidden>
                  <svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M7 17L17 7M10 7h7v7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
              <button
                type="button"
                className={styles.burger}
                onClick={() => setOpen(true)}
                aria-label="Abrir menú"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeMiterlimit="10"
                    strokeWidth="1.5"
                    d="M4.5 12h15m-15 5.77h15M4.5 6.23h15"
                  />
                </svg>
              </button>
            </div>
          </nav>
        </div>
      </div>

      {open ? (
        <div className={styles.overlay} onClick={() => setOpen(false)} aria-hidden />
      ) : null}

      <aside
        className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}
        aria-hidden={!open}
      >
        <div className={styles.drawerHead}>
          <span className={styles.drawerTitle}>Menú</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className={styles.drawerClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className={styles.drawerSearch}>
          <CourseSearchField
            variant="hero"
            fullWidth
            placeholder="¿Qué quieres aprender?"
            inputId="drawer-course-search"
          />
        </div>
        <div className={styles.drawerScroll}>
          <Link
            href="/inspiracion"
            className={styles.drawerInspiracion}
            onClick={() => setOpen(false)}
          >
            Inspiración
          </Link>
          <DrawerCategoriesSection onNavigate={() => setOpen(false)} />
        </div>
        <div className={styles.drawerActions}>
          <Link href="/login" className={styles.drawerGhost} onClick={() => setOpen(false)}>
            Ingresar
          </Link>
          <Link href="/cursos" className={styles.drawerCta} onClick={() => setOpen(false)}>
            Recursos
          </Link>
        </div>
      </aside>
    </header>
  );
}
