'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './CourseSectionNav.module.css';

const SECTION_IDS = ['beneficios', 'programa', 'opiniones'] as const;

type SectionId = (typeof SECTION_IDS)[number];

/** Tope absoluto: si el scroll no termina, soltamos el lock. */
const SCROLL_LOCK_MAX_MS = 2400;

function pickActiveSection(): SectionId {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return SECTION_IDS[0];
  }

  /*
    Franja desde el viewport: misma orden que SECTION_IDS (arriba → abajo).
    La última sección con top por encima de la línea suele incluir Opiniones al final.
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
  /** Cuando tiene un valor, el spy está silenciado y muestra ese ID. */
  const lockedTargetRef = useRef<SectionId | null>(null);

  useEffect(() => {
    let raf = 0;
    const onScrollResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (lockedTargetRef.current !== null) return;
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
    const el = document.getElementById(id);
    if (!el) return;

    // Mantenemos el indicador fijo en el destino mientras dura el scroll
    // suave; así no salta a las secciones intermedias por las que pasa.
    lockedTargetRef.current = id;
    setActive(id);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    let cleanup = () => {};
    const release = () => {
      cleanup();
      // Una vez parado el scroll, sincronizamos por si el navegador
      // dejó la sección un poco fuera de la franja.
      lockedTargetRef.current = null;
      setActive(pickActiveSection());
    };

    // Camino preferido: evento `scrollend` (Chrome/Firefox modernos).
    const supportsScrollEnd = 'onscrollend' in (window as object);
    if (supportsScrollEnd) {
      const onEnd = () => release();
      window.addEventListener('scrollend', onEnd, { once: true });
      const safety = window.setTimeout(release, SCROLL_LOCK_MAX_MS);
      cleanup = () => {
        window.removeEventListener('scrollend', onEnd);
        window.clearTimeout(safety);
      };
      return;
    }

    // Fallback (Safari, etc.): detectamos cuando scrollY se estabiliza.
    let lastY = window.scrollY;
    let stableTicks = 0;
    let raf = 0;
    const start = Date.now();
    const tick = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 1) {
        stableTicks += 1;
        if (stableTicks >= 6) {
          release();
          return;
        }
      } else {
        stableTicks = 0;
        lastY = y;
      }
      if (Date.now() - start > SCROLL_LOCK_MAX_MS) {
        release();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    cleanup = () => cancelAnimationFrame(raf);
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
