'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CURSOS_NAV, FRONT_WEB_NAV, type NavTab } from './nav-items';
import { isCursosNavActive } from './nav-utils';
import styles from './layout.module.css';

interface DashboardNavProps {
  /** Cierra el drawer móvil al navegar */
  onNavigate?: () => void;
}

export function DashboardNav({ onNavigate }: DashboardNavProps) {
  const pathname = usePathname();
  const [tab, setTab] = useState<NavTab>('cursos');

  useEffect(() => {
    if (pathname?.startsWith('/dashboard')) {
      setTab('cursos');
    }
  }, [pathname]);

  return (
    <div className={styles.navShell}>
      <div className={styles.navTabs} role="tablist" aria-label="Secciones del panel">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'cursos'}
          className={`${styles.navTab} ${tab === 'cursos' ? styles.navTabActive : ''}`}
          onClick={() => setTab('cursos')}
        >
          Cursos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'front'}
          className={`${styles.navTab} ${tab === 'front' ? styles.navTabActive : ''}`}
          onClick={() => setTab('front')}
        >
          Front web
        </button>
      </div>

      {tab === 'cursos' && (
        <div
          className={styles.navPanel}
          role="tabpanel"
          aria-label="Herramientas de cursos"
        >
          <p className={styles.navPanelHint}>Panel interno</p>
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
      )}

      {tab === 'front' && (
        <div
          className={styles.navPanel}
          role="tabpanel"
          aria-label="Sitio público"
        >
          <p className={styles.navPanelHint}>Vista previa del sitio</p>
          <ul className={styles.navList}>
            {FRONT_WEB_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={styles.navItemFront}
                  onClick={onNavigate}
                >
                  <span>{item.label}</span>
                  <span className={styles.navItemExternal} aria-hidden="true">
                    ↗
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
