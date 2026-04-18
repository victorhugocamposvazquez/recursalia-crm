'use client';

import { usePathname } from 'next/navigation';
import styles from './MarketingMain.module.css';

export function MarketingMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <main className={isHome ? undefined : styles.mainBelowHeader}>{children}</main>
  );
}
