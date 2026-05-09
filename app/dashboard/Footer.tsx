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
  const [creationMode, setCreationMode] = useState<'ai' | 'manual'>('ai');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const handleLoading = (e: Event) => {
      setIsGenerating((e as CustomEvent<boolean>).detail);
    };
    const handleCreationMode = (e: Event) => {
      setCreationMode((e as CustomEvent<'ai' | 'manual'>).detail);
    };
    window.addEventListener('course-generating', handleLoading);
    window.addEventListener('course-creation-mode', handleCreationMode);
    return () => {
      window.removeEventListener('course-generating', handleLoading);
      window.removeEventListener('course-creation-mode', handleCreationMode);
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
              {isGenerating
                ? creationMode === 'manual'
                  ? 'Creando borrador...'
                  : 'Generando...'
                : creationMode === 'manual'
                  ? 'Crear borrador manual'
                  : 'Generar con IA'}
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
