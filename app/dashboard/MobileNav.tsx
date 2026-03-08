'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './layout.module.css';

interface MobileNavProps {
  userEmail: string;
}

export function MobileNav({ userEmail }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

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
        <span className={styles.mobileBrand}>Course Generator</span>
      </header>

      <div
        className={`${styles.mobileOverlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden={!isOpen}
      />

      <aside className={`${styles.mobilePanel} ${isOpen ? styles.panelOpen : ''}`}>
        <div className={styles.mobilePanelHeader}>
          <span className={styles.mobileBrand}>Course Generator</span>
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
          <Link href="/dashboard" className={styles.navLink} onClick={() => setIsOpen(false)}>
            Generar curso
          </Link>
          <Link href="/dashboard/courses" className={styles.navLink} onClick={() => setIsOpen(false)}>
            Mis cursos
          </Link>
          <Link href="/dashboard/reviews" className={styles.navLink} onClick={() => setIsOpen(false)}>
            Generar reseñas
          </Link>
        </nav>
        <div className={styles.user}>
          <span>{userEmail}</span>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className={styles.logoutBtn}>
              Salir
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
