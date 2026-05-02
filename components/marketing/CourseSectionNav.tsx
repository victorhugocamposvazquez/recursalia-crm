'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './CourseSectionNav.module.css';

const SECTION_IDS = ['beneficios', 'programa', 'opiniones'] as const;

type SectionId = (typeof SECTION_IDS)[number];

export function CourseSectionNav() {
  const [active, setActive] = useState<SectionId>('beneficios');

  const scrollTo = useCallback((id: SectionId) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

  useEffect(() => {
    const els = SECTION_IDS.flatMap((id) => {
      const el = document.getElementById(id);
      return el ? [el] : [];
    });
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        let bestId: SectionId | null = null;
        let bestRatio = 0;
        entries.forEach((e) => {
          if (!(e.target instanceof HTMLElement)) return;
          const sid = e.target.id as SectionId;
          if (!SECTION_IDS.includes(sid)) return;
          if (e.intersectionRatio > bestRatio && e.intersectionRatio > 0.12) {
            bestRatio = e.intersectionRatio;
            bestId = sid;
          }
        });
        if (bestId) setActive(bestId);
      },
      {
        threshold: [0, 0.08, 0.15, 0.35, 0.55],
        rootMargin: '-88px 0px -52% 0px',
      }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <nav className={styles.stickyWrap} aria-label="Secciones del curso">
      <div className={styles.tray}>
        <button
          type="button"
          className={active === 'beneficios' ? styles.linkActive : styles.link}
          aria-current={active === 'beneficios' ? 'true' : undefined}
          onClick={() => scrollTo('beneficios')}
        >
          Beneficios
        </button>
        <button
          type="button"
          className={active === 'programa' ? styles.linkActive : styles.link}
          aria-current={active === 'programa' ? 'true' : undefined}
          onClick={() => scrollTo('programa')}
        >
          Programa
        </button>
        <button
          type="button"
          className={active === 'opiniones' ? styles.linkActive : styles.link}
          aria-current={active === 'opiniones' ? 'true' : undefined}
          onClick={() => scrollTo('opiniones')}
        >
          Opiniones
        </button>
      </div>
    </nav>
  );
}
