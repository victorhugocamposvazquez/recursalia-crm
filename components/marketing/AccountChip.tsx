'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AccountChip.module.css';

type SessionInfo =
  | { authenticated: false }
  | { authenticated: true; email: string; role: 'admin' | 'student' };

export function AccountChip() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancel = false;
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data: SessionInfo) => {
        if (!cancel) setSession(data);
      })
      .catch(() => {
        if (!cancel) setSession({ authenticated: false });
      });
    return () => {
      cancel = true;
    };
  }, []);

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
      setSession({ authenticated: false });
      setOpen(false);
      router.push('/');
      router.refresh();
    }
  }

  if (session === null) {
    return <span className={styles.placeholder} aria-hidden />;
  }

  if (!session.authenticated) {
    return (
      <Link href="/login" className={styles.loginBtn}>
        <span className={styles.loginBtnDot} aria-hidden />
        <span>Acceder</span>
      </Link>
    );
  }

  const initial = (session.email || '?').charAt(0).toUpperCase();

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={`${styles.chip} ${open ? styles.chipOpen : ''}`.trim()}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={styles.avatar} aria-hidden>
          {initial}
          <span className={styles.avatarRing} aria-hidden />
        </span>
        <span className={styles.chipLabel}>Mi área</span>
        <svg
          className={`${styles.chipCaret} ${open ? styles.chipCaretOpen : ''}`.trim()}
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
                {session.role === 'admin' ? 'Administrador' : 'Alumno'}
              </span>
              <span className={styles.menuEmail} title={session.email}>
                {session.email}
              </span>
            </div>
          </div>

          <div className={styles.menuDivider} />

          <Link href="/aprender" className={styles.menuItem} role="menuitem" onClick={() => setOpen(false)}>
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
            href="/aprender/cuenta"
            className={styles.menuItem}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <IconUser /> <span>Mi cuenta</span>
          </Link>
          {session.role === 'admin' ? (
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
      <path
        d="M12 3l9 5-9 5-9-5 9-5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
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
      <path
        d="M4 21a8 8 0 0116 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
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
