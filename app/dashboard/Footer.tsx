'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './layout.module.css';

interface FooterProps {
  userEmail: string;
}

export function Footer({ userEmail }: FooterProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isGeneratePage = pathname === '/dashboard';
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={styles.footerLogoutBtn}
          >
            {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
          </button>
        </div>
      </div>
    </footer>
  );
}
