'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isMarketingCourseLandingPath } from '@/lib/marketing-path';
import styles from './MarketingMobileCatalogCta.module.css';

/**
 * En viewport estrecha: acceso fijo al catálogo con el mismo aspecto que el CTA azul del header.
 */
export function MarketingMobileCatalogCta() {
  const pathname = usePathname();
  if (pathname === '/inspiracion') return null;
  if (isMarketingCourseLandingPath(pathname)) return null;
  if (pathname === '/cursos') return null;

  return (
    <Link href="/cursos" className={styles.wrap} aria-label="Ver todo el catálogo">
      <span className={styles.label}>Ver todo el catálogo</span>
      <span className={styles.badge} aria-hidden>
        <svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M7 17L17 7M10 7h7v7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}
