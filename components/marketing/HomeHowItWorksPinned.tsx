'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import homeStyles from '@/app/(marketing)/home.module.css';

type Step = {
  id: string;
  step: string;
  title: string;
  body: string;
  visual: ReactNode;
};

function CatalogMock() {
  return (
    <div className={homeStyles.mockCatalog} aria-hidden>
      <div className={`${homeStyles.mockCatalogCard} ${homeStyles.mockCatalogCardA}`}>
        <span className={homeStyles.mockCatalogImg} />
        <span className={`${homeStyles.mockLine} ${homeStyles.mockLineFull}`} />
        <span className={homeStyles.mockLine} />
        <span className={homeStyles.mockTagBlue}>Marketing</span>
      </div>
      <div
        className={`${homeStyles.mockCatalogCard} ${homeStyles.mockCatalogCardB} ${homeStyles.mockCatalogCardActive}`}
      >
        <span className={`${homeStyles.mockCatalogImg} ${homeStyles.mockCatalogImgGreen}`} />
        <span className={`${homeStyles.mockLine} ${homeStyles.mockLineFull}`} />
        <span className={homeStyles.mockLine} />
        <span className={homeStyles.mockTagGreen}>Yoga</span>
        <span className={homeStyles.mockCursor} aria-hidden>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
            <path d="M5 3v15l4-3 2.5 5 2.4-1-2.5-5h5L5 3Z" />
          </svg>
        </span>
      </div>
      <div className={`${homeStyles.mockCatalogCard} ${homeStyles.mockCatalogCardC}`}>
        <span className={`${homeStyles.mockCatalogImg} ${homeStyles.mockCatalogImgAmber}`} />
        <span className={`${homeStyles.mockLine} ${homeStyles.mockLineFull}`} />
        <span className={homeStyles.mockLine} />
        <span className={homeStyles.mockTagAmber}>Fotografía</span>
      </div>
    </div>
  );
}

function PlayerMock() {
  return (
    <div className={homeStyles.mockPlayer} aria-hidden>
      <div className={homeStyles.mockPlayerScreen}>
        <span className={homeStyles.mockPlayerGlow} />
        <button type="button" className={homeStyles.mockPlayBtn} tabIndex={-1} aria-hidden>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <div className={homeStyles.mockPlayerControls}>
          <span className={homeStyles.mockPlayerTime}>04:12</span>
          <div className={homeStyles.mockPlayerBar}>
            <span className={homeStyles.mockPlayerProgress} />
          </div>
          <span className={homeStyles.mockPlayerTime}>11:08</span>
        </div>
      </div>
      <div className={homeStyles.mockPlayerCaption}>
        <span className={`${homeStyles.mockLine} ${homeStyles.mockLineFull}`} />
        <span className={homeStyles.mockLine} />
      </div>
    </div>
  );
}

function DiplomaMock() {
  return (
    <div className={homeStyles.mockDiploma} aria-hidden>
      <span className={homeStyles.mockDiplomaCorner} />
      <span className={homeStyles.mockDiplomaCornerAlt} />
      <span className={homeStyles.mockDiplomaKicker}>Recursalia</span>
      <h3 className={homeStyles.mockDiplomaTitle}>Diploma de aprovechamiento</h3>
      <p className={homeStyles.mockDiplomaName}>Hugo C.</p>
      <p className={homeStyles.mockDiplomaCourse}>Marketing digital aplicado</p>
      <div className={homeStyles.mockDiplomaSeal} aria-hidden>
        <svg viewBox="0 0 48 48" width="56" height="56" aria-hidden>
          <defs>
            <linearGradient id="sealGrad" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <circle cx="24" cy="24" r="14" fill="url(#sealGrad)" />
          <path
            d="M24 14l2.6 5.5 6 .8-4.4 4 1.1 5.9-5.3-2.9-5.3 2.9 1.1-5.9-4.4-4 6-.8z"
            fill="#fff8ec"
          />
          <path d="M16 36l8 4 8-4-2 8h-12z" fill="url(#sealGrad)" />
        </svg>
      </div>
    </div>
  );
}

const STEPS: Step[] = [
  {
    id: 'pick',
    step: '01',
    title: 'Elige el curso',
    body: 'Más de un centenar de cursos prácticos en categorías como salud, marketing, idiomas, finanzas o fotografía. Filtra por nivel, duración y precio para encontrar el que encaja contigo.',
    visual: <CatalogMock />,
  },
  {
    id: 'learn',
    step: '02',
    title: 'Aprende a tu ritmo',
    body: 'Acceso de por vida a vídeos, lecciones y material descargable. Empieza hoy y avanza cuando quieras desde cualquier dispositivo, sin fechas límite ni clases en directo.',
    visual: <PlayerMock />,
  },
  {
    id: 'prove',
    step: '03',
    title: 'Demuéstralo',
    body: 'Recibe diploma de aprovechamiento al completar el curso, con código de verificación que puedes compartir en LinkedIn, y suma puntos para nuestra bolsa de empleo.',
    visual: <DiplomaMock />,
  },
];

export function HomeHowItWorksPinned() {
  const [activeStep, setActiveStep] = useState(0);
  const [staticMode, setStaticMode] = useState(true);
  const markersRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const desktopQ = window.matchMedia('(min-width: 768px)');
    const motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    const compute = () => setStaticMode(!desktopQ.matches || motionQ.matches);
    compute();
    desktopQ.addEventListener('change', compute);
    motionQ.addEventListener('change', compute);
    return () => {
      desktopQ.removeEventListener('change', compute);
      motionQ.removeEventListener('change', compute);
    };
  }, []);

  useEffect(() => {
    if (staticMode) return;
    const markers = markersRef.current.filter(
      (el): el is HTMLDivElement => el !== null
    );
    if (markers.length !== STEPS.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex: number | null = null;
        let bestRatio = 0;
        for (const entry of entries) {
          const idxAttr = (entry.target as HTMLElement).dataset.idx;
          if (!idxAttr) continue;
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = Number(idxAttr);
          }
        }
        if (bestIndex !== null) setActiveStep(bestIndex);
      },
      {
        rootMargin: '-45% 0px -45% 0px',
        threshold: [0, 0.01, 0.1],
      }
    );

    markers.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [staticMode]);

  if (staticMode) {
    return (
      <ol className={homeStyles.howStatic}>
        {STEPS.map((s, i) => (
          <li key={s.id} className={homeStyles.howStaticCard}>
            <div className={homeStyles.howStaticVisual}>{s.visual}</div>
            <div className={homeStyles.howStaticBody}>
              <div className={homeStyles.howStaticHead}>
                <span className={homeStyles.howStaticNum}>{s.step}</span>
                <span className={homeStyles.howStaticLine} aria-hidden />
              </div>
              <h3 className={homeStyles.howStaticTitle}>{s.title}</h3>
              <p className={homeStyles.howStaticText}>{s.body}</p>
            </div>
            {i < STEPS.length - 1 ? (
              <span className={homeStyles.howStaticConnector} aria-hidden />
            ) : null}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div className={homeStyles.howOuter}>
      <div className={homeStyles.howSticky}>
        <div className={homeStyles.howCopy}>
          <ol className={homeStyles.howRail} aria-label="Pasos para aprender en Recursalia">
            {STEPS.map((s, i) => {
              const isActive = activeStep === i;
              return (
                <li
                  key={s.id}
                  className={`${homeStyles.howRailItem} ${
                    isActive ? homeStyles.howRailItemActive : ''
                  }`}
                >
                  <span className={homeStyles.howRailDot} aria-hidden />
                  <span className={homeStyles.howRailLabel}>{s.step}</span>
                </li>
              );
            })}
          </ol>

          <div className={homeStyles.howCopyStack}>
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`${homeStyles.howCopyPanel} ${
                  activeStep === i ? homeStyles.howCopyPanelActive : ''
                }`}
                aria-hidden={activeStep !== i}
              >
                <span className={homeStyles.howCopyKicker}>Paso {s.step}</span>
                <h3 className={homeStyles.howCopyTitle}>{s.title}</h3>
                <p className={homeStyles.howCopyBody}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={homeStyles.howVisual}>
          <span className={homeStyles.howVisualGlow} aria-hidden />
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`${homeStyles.howVisualSlot} ${
                activeStep === i ? homeStyles.howVisualSlotActive : ''
              }`}
              aria-hidden={activeStep !== i}
            >
              {s.visual}
            </div>
          ))}
        </div>
      </div>

      {STEPS.map((_, i) => (
        <div
          key={`marker-${i}`}
          ref={(el) => {
            markersRef.current[i] = el;
          }}
          data-idx={i}
          className={homeStyles.howMarker}
          aria-hidden
        />
      ))}
    </div>
  );
}
