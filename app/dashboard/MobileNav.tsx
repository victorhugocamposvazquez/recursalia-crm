'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { DASHBOARD_NAV } from './nav-items';
import styles from './layout.module.css';

interface MobileNavProps {
  userEmail: string;
}

export function MobileNav({ userEmail }: MobileNavProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (res.ok || res.redirected) {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <header className={styles.mobileHeader}>
        <button
          type="button"
          className={styles.hamburger}
          onClick={() => setIsOpen(true)}
          aria-label="Abrir menú"
        >
          <span />
          <span />
          <span />
        </button>
        <Image
          src="/logos/recursalia-logo.png"
          alt="Recursalia"
          width={118}
          height={36}
          priority
          className={styles.mobileBrandLogo}
        />
      </header>

      <div
        className={`${styles.mobileOverlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden={!isOpen}
      />

      <aside className={`${styles.mobilePanel} ${isOpen ? styles.panelOpen : ''}`}>
        <div className={styles.mobilePanelHeader}>
          <Image
            src="/logos/recursalia-logo.png"
            alt="Recursalia"
            width={118}
            height={36}
            priority
            className={styles.mobileBrandLogo}
          />
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar menú"
          >
            <span>×</span>
          </button>
        </div>
        <nav className={styles.mobileNav}>
          {DASHBOARD_NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.navLink}
              onClick={() => setIsOpen(false)}
            >
              <span className={styles.navIdx} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className={styles.user}>
          <span>{userEmail}</span>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={styles.logoutBtn}
          >
            {isLoggingOut ? 'Cerrando...' : 'Salir'}
          </button>
        </div>
      </aside>
    </>
  );
}
