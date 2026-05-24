'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './LearnTopbar.module.css';

interface LearnTopbarProps {
  email: string;
  role: 'admin' | 'student';
}

const NAV_ITEMS = [
  { href: '/aprender', label: 'Mis cursos', match: (p: string) => p === '/aprender' },
  {
    href: '/aprender/catalogo',
    label: 'Catálogo',
    match: (p: string) => p.startsWith('/aprender/catalogo'),
  },
  {
    href: '/aprender/diplomas',
    label: 'Diplomas',
    match: (p: string) => p.startsWith('/aprender/diplomas'),
  },
  {
    href: '/aprender/cuenta',
    label: 'Mi cuenta',
    match: (p: string) => p.startsWith('/aprender/cuenta'),
  },
] as const;

export function LearnTopbar({ email, role }: LearnTopbarProps) {
  const router = useRouter();
  const pathname = usePathname() ?? '/aprender';
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    } finally {
      setLoggingOut(false);
      setOpen(false);
      router.push('/login');
      router.refresh();
    }
  }

  const initial = (email || '?').charAt(0).toUpperCase();

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link href="/aprender" className={styles.brand} aria-label="Recursalia Aprender">
          <Image
            src="/logos/recursalia-logo.png"
            alt="Recursalia"
            width={166}
            height={58}
            priority
            className={styles.brandLogo}
          />
        </Link>

        <nav className={styles.nav} aria-label="Navegación de aprender">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`.trim()}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
          {role === 'admin' ? (
            <Link href="/dashboard" className={styles.navLinkAdmin}>
              Panel admin
            </Link>
          ) : null}
        </nav>

        <div className={styles.userWrap} ref={wrapRef}>
          <button
            type="button"
            className={`${styles.userBtn} ${open ? styles.userBtnOpen : ''}`.trim()}
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <span className={styles.avatar} aria-hidden>
              {initial}
              <span className={styles.avatarRing} aria-hidden />
            </span>
            <span className={styles.userEmail}>{email}</span>
            <svg
              className={`${styles.caret} ${open ? styles.caretOpen : ''}`.trim()}
              width="12"
              height="12"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                d="M6 9l6 6 6-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {open ? (
            <div className={styles.menu} role="menu">
              <div className={styles.menuHeader}>
                <span className={styles.menuAvatar} aria-hidden>{initial}</span>
                <div className={styles.menuHeaderText}>
                  <span className={styles.menuRole}>
                    {role === 'admin' ? 'Administrador' : 'Alumno'}
                  </span>
                  <span className={styles.menuEmailText}>{email}</span>
                </div>
              </div>

              <div className={styles.menuDivider} />

              <Link
                href="/aprender"
                className={styles.menuItem}
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <IconGrid /> <span>Mis cursos</span>
              </Link>
              <Link
                href="/aprender/catalogo"
                className={styles.menuItem}
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <IconLayers /> <span>Catálogo</span>
              </Link>
              <Link
                href="/aprender/diplomas"
                className={styles.menuItem}
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <IconDoc /> <span>Diplomas</span>
              </Link>
              <Link
                href="/aprender/cuenta"
                className={styles.menuItem}
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <IconUser /> <span>Mi cuenta y contraseña</span>
              </Link>
              {role === 'admin' ? (
                <Link
                  href="/dashboard"
                  className={`${styles.menuItem} ${styles.menuItemAdmin}`}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  <IconShield /> <span>Panel admin</span>
                </Link>
              ) : null}

              <div className={styles.menuDivider} />

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className={styles.menuLogout}
                role="menuitem"
              >
                <IconLogout />
                <span>{loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l9 5-9 5-9-5 9-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path
        d="M3 13l9 5 9-5M3 18l9 5 9-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 21a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l8 3v6c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V6l8-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10 17l-5-5 5-5M5 12h11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
