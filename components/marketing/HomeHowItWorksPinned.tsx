'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import homeStyles from '@/app/(marketing)/home.module.css';
import { HandPointer } from '@/components/marketing/DoodleAccents';

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
          <HandPointer width={26} height={26} color="#0f172a" strokeWidth={1.6} />
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

function MultiDeviceMock() {
  return (
    <div className={homeStyles.mockMulti} aria-hidden>
      <div className={homeStyles.mockMultiLaptop}>
        <div className={homeStyles.mockMultiLaptopBezel}>
          <div className={homeStyles.mockPdfDoc}>
            <div className={homeStyles.mockPdfBar}>
              <span className={homeStyles.mockPdfTab}>
                <span className={homeStyles.mockPdfTabIcon} aria-hidden>
                  PDF
                </span>
                <span>Recurso · Tema 3</span>
              </span>
              <span className={homeStyles.mockPdfPageNum}>3 / 12</span>
            </div>
            <div className={homeStyles.mockPdfBody}>
              <span className={homeStyles.mockPdfH1} />
              <span className={`${homeStyles.mockLine} ${homeStyles.mockLineFull}`} />
              <span className={homeStyles.mockLine} />
              <span className={`${homeStyles.mockLine} ${homeStyles.mockLineFull}`} />
              <span className={homeStyles.mockPdfH2} />
              <span className={homeStyles.mockLine} />
              <span className={`${homeStyles.mockLine} ${homeStyles.mockLineFull}`} />
            </div>
          </div>
        </div>
        <div className={homeStyles.mockMultiLaptopBase} aria-hidden />
      </div>
      <div className={homeStyles.mockMultiPhone}>
        <span className={homeStyles.mockMultiPhoneNotch} aria-hidden />
        <div className={homeStyles.mockMultiPhoneScreen}>
          <span className={homeStyles.mockPdfH1} />
          <span className={`${homeStyles.mockLine} ${homeStyles.mockLineFull}`} />
          <span className={homeStyles.mockLine} />
          <span className={homeStyles.mockPdfH2} />
          <span className={homeStyles.mockLine} />
        </div>
      </div>
    </div>
  );
}

function DiplomaMock() {
  return (
    <div className={homeStyles.mockDiploma} aria-hidden>
      <span className={homeStyles.mockDiplomaFrame} aria-hidden />
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

function JobMock() {
  return (
    <div className={homeStyles.mockJob} aria-hidden>
      <div className={homeStyles.mockJobHeader}>
        <span className={homeStyles.mockJobLogo} aria-hidden>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
            <path
              d="M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8zm5-3h6a1 1 0 0 1 1 1v2H8V6a1 1 0 0 1 1-1z"
              fill="#0f172a"
              opacity="0.85"
            />
            <rect x="4" y="11" width="16" height="2" fill="#d8ff5c" />
          </svg>
        </span>
        <div className={homeStyles.mockJobMeta}>
          <span className={`${homeStyles.mockLine} ${homeStyles.mockLineFull}`} />
          <span className={homeStyles.mockLine} />
        </div>
        <span className={homeStyles.mockJobBadge}>Nuevo</span>
      </div>
      <p className={homeStyles.mockJobTitle}>
        Te invitan a una entrevista
      </p>
      <p className={homeStyles.mockJobCompany}>Studio Norte · Marketing</p>
      <div className={homeStyles.mockJobActions}>
        <span className={homeStyles.mockJobBtn}>Aceptar</span>
        <span className={`${homeStyles.mockJobBtn} ${homeStyles.mockJobBtnGhost}`}>
          Más tarde
        </span>
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
    body: 'Lecciones y material descargable en PDF que abres en el ordenador, la tablet o el móvil. Empieza hoy y avanza cuando quieras, sin fechas límite ni clases en directo.',
    visual: <MultiDeviceMock />,
  },
  {
    id: 'diploma',
    step: '03',
    title: 'Obtén tu diploma',
    body: 'Al completar el curso recibes un diploma de aprovechamiento con código de verificación que puedes compartir en LinkedIn y sumar a tu CV.',
    visual: <DiplomaMock />,
  },
  {
    id: 'job',
    step: '04',
    title: 'Encuentra trabajo',
    body: 'Suma puntos para nuestra bolsa de empleo y conecta con empresas que buscan talento como el tuyo. Tu próximo paso profesional empieza aquí.',
    visual: <JobMock />,
  },
];

function JourneyConnector({
  active,
  flipped,
}: {
  active: boolean;
  flipped?: boolean;
}) {
  // Path en S, dibujado en dos trazados:
  //  - Guides (dashed, siempre visibles, sutiles)
  //  - Trail (sólido, se va dibujando con el scroll cuando entra el step siguiente)
  //  Truco pathLength="1" → animamos stroke-dashoffset de 1 → 0.
  const trailStyle = {
    strokeDasharray: 1,
    strokeDashoffset: active ? 0 : 1,
    transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
  } as const;
  const arrowStyle = {
    opacity: active ? 1 : 0,
    transform: active ? 'translateY(0)' : 'translateY(-4px)',
    transition: 'opacity 0.4s ease 0.45s, transform 0.4s ease 0.45s',
    transformOrigin: 'center',
  } as const;

  return (
    <svg
      className={homeStyles.journeyConnector}
      viewBox="0 0 60 110"
      preserveAspectRatio="none"
      aria-hidden
      style={flipped ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path
        className={homeStyles.journeyConnectorGuides}
        d="M30 4 C 10 28, 50 72, 30 104"
        fill="none"
        strokeLinecap="round"
      />
      <path
        className={homeStyles.journeyConnectorTrail}
        d="M30 4 C 10 28, 50 72, 30 104"
        fill="none"
        strokeLinecap="round"
        pathLength={1}
        style={trailStyle}
      />
      <path
        className={homeStyles.journeyConnectorArrow}
        d="M22 96 L30 104 L38 96"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={arrowStyle}
      />
    </svg>
  );
}

export function HomeHowItWorksPinned() {
  const [revealed, setRevealed] = useState<boolean[]>(() =>
    STEPS.map(() => false)
  );
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQ.matches) {
      setRevealed(STEPS.map(() => true));
      return;
    }

    const items = stepRefs.current.filter(
      (el): el is HTMLLIElement => el !== null
    );
    if (items.length !== STEPS.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setRevealed((prev) => {
          let changed = false;
          const next = prev.slice();
          for (const entry of entries) {
            const idxAttr = (entry.target as HTMLElement).dataset.idx;
            if (!idxAttr) continue;
            const idx = Number(idxAttr);
            const top = entry.boundingClientRect.top;
            // Mientras está intersectando el viewport, queda revelado.
            // Si dejó de intersectar y está por debajo (top > 0), significa
            // que el usuario scrolleó hacia arriba y dejó atrás el paso →
            // se "desrellena". Si dejó de intersectar y está por encima
            // (top < 0), el usuario lo ha pasado scrolleando hacia abajo
            // y conservamos el estado revelado.
            let nextValue: boolean;
            if (entry.isIntersecting) {
              nextValue = true;
            } else if (top > 0) {
              nextValue = false;
            } else {
              nextValue = next[idx];
            }
            if (next[idx] !== nextValue) {
              next[idx] = nextValue;
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      },
      {
        rootMargin: '0px 0px -25% 0px',
        threshold: 0.2,
      }
    );

    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <ol
      className={homeStyles.journey}
      aria-label="Pasos para aprender en Recursalia"
    >
      {STEPS.map((s, i) => {
        const isRevealed = revealed[i];
        const nextRevealed = i < STEPS.length - 1 ? revealed[i + 1] : false;
        const flipped = i % 2 === 1; // alterna lado en desktop
        return (
          <li
            key={s.id}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
            data-idx={i}
            className={`${homeStyles.journeyStep} ${
              flipped ? homeStyles.journeyStepFlipped : ''
            } ${isRevealed ? homeStyles.journeyStepRevealed : ''}`}
          >
            <div className={homeStyles.journeyMarker} aria-hidden>
              <span className={homeStyles.journeyNumber}>{s.step}</span>
            </div>
            <div className={homeStyles.journeyContent}>
              <h3 className={homeStyles.journeyTitle}>{s.title}</h3>
              <p className={homeStyles.journeyBody}>{s.body}</p>
            </div>
            <div className={homeStyles.journeyVisual} aria-hidden>
              {s.visual}
            </div>
            {i < STEPS.length - 1 ? (
              <div className={homeStyles.journeyConnectorWrap} aria-hidden>
                <JourneyConnector active={!!nextRevealed} flipped={flipped} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
