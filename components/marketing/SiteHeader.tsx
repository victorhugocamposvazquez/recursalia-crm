'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './SiteHeader.module.css';

const NAV_ITEMS = [
  { label: 'Soluciones', href: '/cursos' },
  { label: 'Recursos', href: '/blog' },
  { label: 'Nosotros', href: '/cursos' },
  { label: 'Clientes', href: '/cursos' },
  { label: 'Recursalia AI', href: '/cursos' },
  { label: 'Referidos', href: '/cursos' },
];

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
      <div className={styles.container}>
        <nav className={`${styles.bar} ${sticky ? styles.barSticky : ''}`}>
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

          <div className={styles.navWrap}>
            <ul className={styles.nav}>
              {NAV_ITEMS.map((item) => {
                const active =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={styles.actions}>
            <Link href="/cursos" className={styles.cta}>
              Recursos
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

      {open ? (
        <div
          className={styles.overlay}
          onClick={() => setOpen(false)}
          aria-hidden
        />
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
        <ul className={styles.drawerNav}>
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className={styles.drawerLink}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className={styles.drawerActions}>
          <Link href="/login" className={styles.drawerGhost}>
            Ingresar
          </Link>
          <Link href="/cursos" className={styles.drawerCta}>
            Agenda un demo
          </Link>
        </div>
      </aside>
    </header>
  );
}
