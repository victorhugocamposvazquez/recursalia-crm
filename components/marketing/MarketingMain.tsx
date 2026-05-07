'use client';

import { usePathname } from 'next/navigation';
import { isMarketingCourseLandingPath } from '@/lib/marketing-path';
import styles from './MarketingMain.module.css';

export function MarketingMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isInspiracion = pathname === '/inspiracion';
  const isCourseLanding = isMarketingCourseLandingPath(pathname);
  /** Blog público: menos hueco bajo cabecera (antes ~4rem vía mainBelowHeader). */
  const isBlogArea = pathname === '/blog' || pathname.startsWith('/blog/');
  /** Índice /cursos: mismo ajuste compacto que el blog bajo cabecera (evita hueco grande de mainBelowHeader). */
  const isCursosCatalog = pathname === '/cursos';

  const mainClass =
    isHome
      ? undefined
      : isInspiracion
        ? styles.mainInspiracionFull
        : isCourseLanding
          ? styles.mainCourseLanding
          : isBlogArea || isCursosCatalog
            ? styles.mainBlog
            : styles.mainBelowHeader;

  return (
    <main id="main-content" className={mainClass}>
      {children}
    </main>
  );
}
