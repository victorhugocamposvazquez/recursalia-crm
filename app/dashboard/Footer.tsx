'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './layout.module.css';

interface FooterProps {
  userEmail: string;
}

export function Footer({ userEmail }: FooterProps) {
  const pathname = usePathname();
  const isGeneratePage = pathname === '/dashboard';
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Escuchar eventos de carga desde la página
    const handleLoading = (e: CustomEvent) => {
      setIsGenerating(e.detail);
    };
    window.addEventListener('course-generating' as any, handleLoading as EventListener);
    return () => {
      window.removeEventListener('course-generating' as any, handleLoading as EventListener);
    };
  }, []);

  const handleGenerate = () => {
    const form = document.querySelector('form[data-course-form]') as HTMLFormElement;
    if (form) {
      setIsGenerating(true);
      form.requestSubmit();
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerUser}>
          <span className={styles.footerEmail}>{userEmail}</span>
        </div>
        <div className={styles.footerActions}>
          {isGeneratePage && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className={styles.footerGenerateBtn}
            >
              {isGenerating ? 'Generando...' : 'Generar curso'}
            </button>
          )}
          <form action="/api/auth/logout" method="post" className={styles.footerLogoutForm}>
            <button type="submit" className={styles.footerLogoutBtn}>
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </footer>
  );
}
