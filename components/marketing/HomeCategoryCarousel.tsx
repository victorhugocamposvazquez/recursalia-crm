'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useMarketingContent } from '@/components/marketing/MarketingContentProvider';
import homeStyles from '@/app/(marketing)/home.module.css';

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

const ICONS: Record<IconName, ReactNode> = {
  yoga: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="5" r="2.4" />
      <path d="M5 13c2.5-1 4.5-1 7-1s4.5 0 7 1" />
      <path d="M12 12v5" />
      <path d="M9 21l3-4 3 4" />
    </svg>
  ),
  relaciones: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  psicologia: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.5 2A4.5 4.5 0 0 0 5 6.5c0 1.2.5 2.3 1.3 3.1C5.5 10.5 5 11.7 5 13a5 5 0 0 0 5 5h.5v3l3-2 3 2v-3h.5a5 5 0 0 0 5-5c0-1.3-.5-2.5-1.3-3.4.8-.8 1.3-1.9 1.3-3.1A4.5 4.5 0 0 0 17.5 2 4.5 4.5 0 0 0 13 4.4 4.5 4.5 0 0 0 9.5 2z" />
    </svg>
  ),
  marketing: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m3 11 18-7-3 16-6-3-3 6-2-7-4-2z" />
      <path d="M14 13l-3 6" />
    </svg>
  ),
  idiomas: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 5h11" />
      <path d="M9 3v2c0 4-2 6-6 8" />
      <path d="M5 9c0 3 4 6 8 7" />
      <path d="m12 21 4-9 4 9" />
      <path d="M13.5 18h5" />
    </svg>
  ),
  fotografia: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 7h4l2-3h6l2 3h4v13H3z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  fisioterapia: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 12V5a2 2 0 0 1 4 0" />
      <path d="M13 11V4a2 2 0 0 1 4 0v9" />
      <path d="M9 9V8a2 2 0 0 0-4 0v8a8 8 0 0 0 16 0v-3" />
    </svg>
  ),
  finanzas: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 17l6-6 4 4 8-9" />
      <path d="M14 6h7v7" />
    </svg>
  ),
  estetica: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2c1.5 3 4 5 7 6-3 1-5.5 3-7 6-1.5-3-4-5-7-6 3-1 5.5-3 7-6z" />
      <path d="M5 18l1 3 1-3 3-1-3-1-1-3-1 3-3 1z" />
    </svg>
  ),
  emprendimiento: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 14c0-5 3-10 7-12 4 2 7 7 7 12-3-1-5-1-7 0-2-1-4-1-7 0z" />
      <path d="M9 16c0 2 1 4 3 4s3-2 3-4" />
      <circle cx="12" cy="9" r="1.5" />
    </svg>
  ),
  diseno: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="14" rx="2" />
      <path d="M7 7h7" />
      <path d="M7 11h4" />
      <path d="M3 21h18" />
    </svg>
  ),
  adelgazamiento: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
      <path d="M9 14l3-3 3 3" />
      <path d="M12 11V7" />
    </svg>
  ),
  desarrollo: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 21V11l8-5 8 5v10" />
      <path d="M4 21h16" />
      <path d="M9 21v-6h6v6" />
    </svg>
  ),
  tecnologia: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="4" width="16" height="13" rx="2" />
      <path d="M2 21h20" />
      <path d="m9 10 2 2-2 2" />
      <path d="M13 14h3" />
    </svg>
  ),
  salud: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12h4l2-6 4 12 2-6h6" />
    </svg>
  ),
  default: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
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

  const updateButtons = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth - 1;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    updateButtons();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateButtons, { passive: true });
    window.addEventListener('resize', updateButtons);
    return () => {
      el.removeEventListener('scroll', updateButtons);
      window.removeEventListener('resize', updateButtons);
    };
  }, [updateButtons, categories.length]);

  // Drag-to-scroll
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    scrollStart: number;
    moved: boolean;
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return; // dejar el touch nativo
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
      // Cancelar el click siguiente si hubo arrastre real
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
    </div>
  );
}
