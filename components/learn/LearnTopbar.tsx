'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './LearnTopbar.module.css';

interface LearnTopbarProps {
  email: string;
  role: 'admin' | 'student';
}

export function LearnTopbar({ email, role }: LearnTopbarProps) {
  const router = useRouter();
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
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    } finally {
      setLoggingOut(false);
      router.push('/login');
      router.refresh();
    }
  }

  const initial = (email || '?').charAt(0).toUpperCase();

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link href="/aprender" className={styles.brand} aria-label="Recursalia Aprender">
          <span className={styles.brandMark} aria-hidden>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <span className={styles.brandText}>
            Recursalia <span className={styles.brandSub}>Aprender</span>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Navegación de aprender">
          <Link href="/aprender" className={styles.navLink}>
            Mis cursos
          </Link>
          <Link href="/cursos" className={styles.navLink}>
            Catálogo
          </Link>
          {role === 'admin' ? (
            <Link href="/dashboard" className={styles.navLinkStrong}>
              Panel admin
            </Link>
          ) : null}
        </nav>

        <div className={styles.userWrap} ref={wrapRef}>
          <button
            type="button"
            className={styles.userBtn}
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <span className={styles.avatar} aria-hidden>{initial}</span>
            <span className={styles.userEmail}>{email}</span>
          </button>
          {open ? (
            <div className={styles.menu} role="menu">
              <div className={styles.menuEmail}>{email}</div>
              <Link
                href="/aprender"
                className={styles.menuItem}
                onClick={() => setOpen(false)}
              >
                Mis cursos
              </Link>
              <Link
                href="/cursos"
                className={styles.menuItem}
                onClick={() => setOpen(false)}
              >
                Explorar catálogo
              </Link>
              {role === 'admin' ? (
                <Link
                  href="/dashboard"
                  className={styles.menuItem}
                  onClick={() => setOpen(false)}
                >
                  Panel admin
                </Link>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className={styles.menuLogout}
              >
                {loggingOut ? 'Cerrando…' : 'Cerrar sesión'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
