'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CURSOS_NAV, FRONT_ADMIN_NAV } from './nav-items';
import { isCursosNavActive, isFrontNavActive } from './nav-utils';
import styles from './layout.module.css';

interface DashboardNavProps {
  onNavigate?: () => void;
}

export function DashboardNav({ onNavigate }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <div className={styles.navShell}>
      <div className={styles.navGroup}>
        <p className={styles.navGroupTitle}>Cursos</p>
        <ul className={styles.navList}>
          {CURSOS_NAV.map((item) => {
            const active = isCursosNavActive(item.href, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={styles.navGroup}>
        <p className={styles.navGroupTitle}>Front web</p>
        <ul className={styles.navList}>
          {FRONT_ADMIN_NAV.map((item) => {
            const active = isFrontNavActive(item.href, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
