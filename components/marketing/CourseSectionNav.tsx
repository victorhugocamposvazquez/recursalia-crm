'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './CourseSectionNav.module.css';

const SECTION_IDS = ['beneficios', 'programa', 'opiniones'] as const;

type SectionId = (typeof SECTION_IDS)[number];

/** ms en los que ignoramos spy tras un clic — evita flicker durante scroll suave */
const SCROLL_LOCK_MS = 900;

function pickActiveSection(): SectionId {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return SECTION_IDS[0];
  }

  /*
    Franja desde el viewport: misma orden que SECTION_IDS (arriba → abajo).
    La última sección con top por encima de la línea suele incluir Opiniones al final.
    Antes IO + rootMargin -52% abajo apenas veía Opinion.
  */
  const zone = Math.min(
    Math.max(Math.round(window.innerHeight * 0.14), 88),
    132
  );
  let current: SectionId = SECTION_IDS[0];
  for (const id of SECTION_IDS) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.getBoundingClientRect().top <= zone) current = id;
  }
  return current;
}

export function CourseSectionNav() {
  const [active, setActive] = useState<SectionId>('beneficios');
  const spyLockUntilRef = useRef<number>(0);

  useEffect(() => {
    let raf = 0;
    const onScrollResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (Date.now() < spyLockUntilRef.current) return;
        setActive(pickActiveSection());
      });
    };

    setActive(pickActiveSection());

    window.addEventListener('scroll', onScrollResize, { passive: true });
    window.addEventListener('resize', onScrollResize, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScrollResize);
      window.removeEventListener('resize', onScrollResize);
    };
  }, []);

  const scrollTo = useCallback((id: SectionId) => {
    spyLockUntilRef.current = Date.now() + SCROLL_LOCK_MS;
    setActive(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    window.setTimeout(() => {
      spyLockUntilRef.current = 0;
      setActive(pickActiveSection());
    }, SCROLL_LOCK_MS);
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
