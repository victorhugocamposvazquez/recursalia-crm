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

  const mainClass =
    isHome
      ? undefined
      : isInspiracion
        ? styles.mainInspiracionFull
        : isCourseLanding
          ? styles.mainCourseLanding
          : isBlogArea
            ? styles.mainBlog
            : styles.mainBelowHeader;

  return <main className={mainClass}>{children}</main>;
}
