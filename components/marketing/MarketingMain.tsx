'use client';

import { usePathname } from 'next/navigation';
import styles from './MarketingMain.module.css';

export function MarketingMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isInspiracion = pathname === '/inspiracion';

  const mainClass = isHome
    ? undefined
    : isInspiracion
      ? styles.mainInspiracionFull
      : styles.mainBelowHeader;

  return <main className={mainClass}>{children}</main>;
}
