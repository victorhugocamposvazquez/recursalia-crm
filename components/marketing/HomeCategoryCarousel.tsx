'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useMarketingContent } from '@/components/marketing/MarketingContentProvider';
import { SwipeHand } from '@/components/marketing/DoodleAccents';
import homeStyles from '@/app/(marketing)/home.module.css';

const HINT_STORAGE_KEY = 'recursalia-cat-hint-seen';

type IconName =
  | 'yoga'
  | 'relaciones'
  | 'psicologia'
  | 'marketing'
  | 'idiomas'
  | 'fotografia'
  | 'fisioterapia'
  | 'finanzas'
  | 'estetica'
  | 'emprendimiento'
  | 'diseno'
  | 'adelgazamiento'
  | 'desarrollo'
  | 'tecnologia'
  | 'salud'
  | 'default';

/**
 * Iconos doodle: trazo grueso, pequeñas imperfecciones, detalles tipo
 * "chispa" o "asterisco" para sentir un dibujo a mano.
 */
const ICONS: Record<IconName, ReactNode> = {
  yoga: (
    <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="16" cy="7" r="2.6" />
      <path d="M5 18c4-2 8-2 11-2s7 0 11 2" />
      <path d="M16 16v6" />
      <path d="M11 28l5-6 5 6" />
      <path d="M26 6l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
    </svg>
  ),
  relaciones: (
    <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M27 11a6 6 0 0 0-11-3 6 6 0 0 0-11 3c0 7 11 14 11 14s11-7 11-14z" />
      <path d="M22 22l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
    </svg>
  ),
  psicologia: (
    <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 4a6 6 0 0 0-5 9c-1 1-2 3-2 5a6 6 0 0 0 6 6h1v4l4-3 4 3v-4h1a6 6 0 0 0 6-6c0-2-1-4-2-5a6 6 0 0 0-5-9 6 6 0 0 0-4 2 6 6 0 0 0-4-2z" />
      <path d="M12 14h2M18 14h2" />
    </svg>
  ),
  marketing: (
    <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 14l22-9-3 21-7-4-4 7-2-9-6-3z" />
      <path d="M18 17l-3 7" />
      <path d="M27 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
    </svg>
  ),
  idiomas: (
    <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 7h14" />
      <path d="M11 4v3c0 5-3 8-8 10" />
      <path d="M6 12c0 4 5 7 11 9" />
      <path d="m15 28 5-12 5 12" />
      <path d="M17 24h6" />
    </svg>
  ),
  fotografia: (
    <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 10h5l3-4h8l3 4h5v17H4z" />
      <circle cx="16" cy="17" r="5" />
      <circle cx="16" cy="17" r="2" fill="currentColor" />
    </svg>
  ),
  fisioterapia: (
    <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 16V7a2.5 2.5 0 0 1 5 0" />
      <path d="M17 14V5a2.5 2.5 0 0 1 5 0v12" />
      <path d="M12 12V11a2.5 2.5 0 0 0-5 0v10a10 10 0 0 0 20 0v-4" />
    </svg>
  ),
  finanzas: (
    <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 22l8-8 5 5 11-12" />
      <path d="M19 7h9v9" />
      <path d="M5 6l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
    </svg>
  ),
  estetica: (
    <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 3c2 4 5 7 9 8-4 1-7 4-9 8-2-4-5-7-9-8 4-1 7-4 9-8z" />
      <path d="M6 22l1 3 1-3 3-1-3-1-1-3-1 3-3 1z" />
      <path d="M25 23l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
    </svg>
  ),
  emprendimiento: (
    <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 18c-1-7 3-13 8-15 5 2 9 8 8 15-3-1-6-1-8 0-2-1-5-1-8 0z" />
      <path d="M11 21c0 3 2 5 5 5s5-2 5-5" />
      <circle cx="16" cy="11" r="2" />
      <path d="M27 6l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
    </svg>
  ),
  diseno: (
    <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="5" width="24" height="17" rx="2.4" />
      <path d="M8 10h12" />
      <path d="M8 14h7" />
      <path d="M8 18h10" />
      <path d="M4 27h24" />
    </svg>
  ),
  adelgazamiento: (
    <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="16" cy="16" r="11" />
      <path d="M11 17l5-4 5 4" />
      <path d="M16 13V8" />
    </svg>
  ),
  desarrollo: (
    <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 27V14l11-7 11 7v13" />
      <path d="M5 27h22" />
      <path d="M12 27v-7h8v7" />
    </svg>
  ),
  tecnologia: (
    <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="5" y="5" width="22" height="17" rx="2.4" />
      <path d="M3 27h26" />
      <path d="m12 12 3 3-3 3" />
      <path d="M17 18h4" />
    </svg>
  ),
  salud: (
    <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 16h5l3-9 6 18 3-9h9" />
    </svg>
  ),
  default: (
    <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="14" cy="14" r="9" />
      <path d="m26 26-5-5" />
    </svg>
  ),
};

function pickIcon(label: string, q: string): IconName {
  const haystack = `${label} ${q}`.toLowerCase();
  if (/yoga|pilates|medita/.test(haystack)) return 'yoga';
  if (/relacion|pareja|amor/.test(haystack)) return 'relaciones';
  if (/psicolog|coaching|mente|emoci/.test(haystack)) return 'psicologia';
  if (/marketing|venta|ventas|publicidad|copy/.test(haystack)) return 'marketing';
  if (/idioma|ingl[ée]s|frances|alem[áa]n|chino/.test(haystack)) return 'idiomas';
  if (/foto/.test(haystack)) return 'fotografia';
  if (/fisio|masaje|terapia/.test(haystack)) return 'fisioterapia';
  if (/finanz|invers|bolsa|cripto|trading/.test(haystack)) return 'finanzas';
  if (/est[ée]tica|belleza|maquillaje|peluqu/.test(haystack)) return 'estetica';
  if (/emprendi|negocio|startup/.test(haystack)) return 'emprendimiento';
  if (/dise[ñn]o|web|ux|ui/.test(haystack)) return 'diseno';
  if (/adelgaz|fitness|nutric|dieta/.test(haystack)) return 'adelgazamiento';
  if (/desarrollo personal|carrera|productividad|h[áa]bitos/.test(haystack)) return 'desarrollo';
  if (/tecnolog|software|programaci|c[óo]digo|ia\b|inteligencia/.test(haystack)) return 'tecnologia';
  if (/salud|bienestar|sueño|sue[ñn]o/.test(haystack)) return 'salud';
  return 'default';
}

export function HomeCategoryCarousel() {
  const { categories } = useMarketingContent();
  const railRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const updateState = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = Math.max(el.scrollWidth - el.clientWidth, 1);
    const left = el.scrollLeft;
    setCanPrev(left > 4);
    setCanNext(left < max - 4);
    setProgress(Math.min(1, Math.max(0, left / max)));
  }, []);

  useEffect(() => {
    updateState();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateState, { passive: true });
    window.addEventListener('resize', updateState);
    return () => {
      el.removeEventListener('scroll', updateState);
      window.removeEventListener('resize', updateState);
    };
  }, [updateState, categories.length]);

  // Hint inicial: mostrar solo en móvil y si el usuario aún no ha visto la pista.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (categories.length === 0) return;
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (!isMobile) return;
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(HINT_STORAGE_KEY) === '1';
    } catch {
      seen = false;
    }
    if (!seen) {
      setShowHint(true);
    }
  }, [categories.length]);

  // Apagar el hint al primer scroll real.
  useEffect(() => {
    if (!showHint) return;
    if (progress > 0.02) {
      setShowHint(false);
      try {
        window.sessionStorage.setItem(HINT_STORAGE_KEY, '1');
      } catch {
        /* noop */
      }
    }
  }, [progress, showHint]);

  // Drag-to-scroll
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    scrollStart: number;
    moved: boolean;
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const el = railRef.current;
    if (!el) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      scrollStart: el.scrollLeft,
      moved: false,
    };
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const el = railRef.current;
    if (!drag || !el) return;
    const dx = e.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) > 6) {
      drag.moved = true;
      el.classList.add(homeStyles.catRailDragging);
    }
    if (drag.moved) {
      el.scrollLeft = drag.scrollStart - dx;
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const el = railRef.current;
    if (!drag || !el) return;
    if (drag.moved) {
      const stop = (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        el.removeEventListener('click', stop, true);
      };
      el.addEventListener('click', stop, true);
      el.classList.remove(homeStyles.catRailDragging);
    }
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    dragRef.current = null;
  };

  const scrollByDir = (dir: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  if (categories.length === 0) return null;

  return (
    <div className={homeStyles.catCarousel}>
      <button
        type="button"
        className={`${homeStyles.catNav} ${homeStyles.catNavPrev}`}
        onClick={() => scrollByDir(-1)}
        aria-label="Desplazar categorías a la izquierda"
        disabled={!canPrev}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m15 6-6 6 6 6" />
        </svg>
      </button>

      <div
        ref={railRef}
        className={homeStyles.catRail}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="list"
      >
        {categories.map((c) => {
          const icon = ICONS[pickIcon(c.label, c.q)];
          return (
            <Link
              key={c.id}
              href={`/cursos?q=${encodeURIComponent(c.q)}`}
              className={homeStyles.catCard}
              draggable={false}
              role="listitem"
            >
              <span className={homeStyles.catCardIcon} aria-hidden>
                {icon}
                <span className={homeStyles.catCardSpark} aria-hidden />
              </span>
              <span className={homeStyles.catCardLabel}>{c.label}</span>
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        className={`${homeStyles.catNav} ${homeStyles.catNavNext}`}
        onClick={() => scrollByDir(1)}
        aria-label="Desplazar categorías a la derecha"
        disabled={!canNext}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>

      <div className={homeStyles.catProgress} aria-hidden>
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>

      {showHint ? (
        <div className={homeStyles.catSwipeHint} aria-hidden>
          <SwipeHand width={48} height={28} color="#0f172a" />
          <span>desliza</span>
        </div>
      ) : null}
    </div>
  );
}
