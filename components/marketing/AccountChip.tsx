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
      setSession({ authenticated: false });
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
        Acceder
      </Link>
    );
  }

  const initial = (session.email || '?').charAt(0).toUpperCase();

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.chip}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={styles.avatar} aria-hidden>{initial}</span>
        <span className={styles.chipLabel}>Mi área</span>
      </button>
      {open ? (
        <div className={styles.menu} role="menu">
          <div className={styles.menuEmail} title={session.email}>{session.email}</div>
          <Link href="/aprender" className={styles.menuItem} onClick={() => setOpen(false)}>
            Mis cursos
          </Link>
          {session.role === 'admin' ? (
            <Link href="/dashboard" className={styles.menuItem} onClick={() => setOpen(false)}>
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
  );
}
