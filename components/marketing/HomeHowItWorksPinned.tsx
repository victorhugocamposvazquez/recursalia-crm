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
      {/* Decoraciones tipo memphis */}
      <span className={homeStyles.mockDiplomaTriBlue} aria-hidden />
      <svg
        className={homeStyles.mockDiplomaDots}
        viewBox="0 0 50 50"
        aria-hidden
      >
        <circle
          cx="25"
          cy="25"
          r="22"
          fill="none"
          stroke="#0f172a"
          strokeWidth="0.7"
          strokeDasharray="0.8 1.6"
        />
      </svg>
      <span className={homeStyles.mockDiplomaXWhite} aria-hidden>
        ×
      </span>
      <span className={homeStyles.mockDiplomaTriYellow} aria-hidden />
      <svg
        className={homeStyles.mockDiplomaRings}
        viewBox="0 0 60 60"
        aria-hidden
      >
        <circle cx="48" cy="48" r="20" fill="none" stroke="#f59e0b" strokeWidth="2" />
        <circle cx="48" cy="48" r="14" fill="none" stroke="#f59e0b" strokeWidth="2" />
        <circle cx="48" cy="48" r="8" fill="none" stroke="#f59e0b" strokeWidth="2" />
      </svg>
      <svg
        className={homeStyles.mockDiplomaCube}
        viewBox="0 0 40 30"
        aria-hidden
      >
        <path d="M5 12 L20 12 L30 6 L15 6 Z" fill="none" stroke="#0f172a" strokeWidth="1" />
        <path d="M20 12 L30 6 L30 22 L20 28 Z" fill="none" stroke="#0f172a" strokeWidth="1" />
        <path d="M5 12 L20 12 L20 28 L5 28 Z" fill="none" stroke="#0f172a" strokeWidth="1" />
      </svg>
      <span className={homeStyles.mockDiplomaXBlue} aria-hidden>
        ×
      </span>

      {/* Contenido */}
      <div className={homeStyles.mockDiplomaContent}>
        <h3 className={homeStyles.mockDiplomaTitle}>CERTIFICADO</h3>
        <p className={homeStyles.mockDiplomaSubtitle}>
          <span aria-hidden>—</span>
          PROFESIONAL
          <span aria-hidden>—</span>
        </p>
        <p className={homeStyles.mockDiplomaName}>Hugo Campos</p>
        <span className={homeStyles.mockDiplomaUnderline} aria-hidden />
        <p className={homeStyles.mockDiplomaFor}>
          Por la satisfactoria realización de:
        </p>
        <div className={homeStyles.mockDiplomaFields}>
          <div className={homeStyles.mockDiplomaField}>
            <span className={homeStyles.mockDiplomaFieldLabel}>CURSO</span>
            <span className={homeStyles.mockDiplomaFieldValue}>
              Marketing digital
            </span>
          </div>
          <div className={homeStyles.mockDiplomaField}>
            <span className={homeStyles.mockDiplomaFieldLabel}>FECHA</span>
            <span className={homeStyles.mockDiplomaFieldValue}>
              13 / Junio / 2026
            </span>
          </div>
        </div>
        <div className={homeStyles.mockDiplomaSignature}>
          <svg
            className={homeStyles.mockDiplomaSignatureSvg}
            viewBox="0 0 60 18"
            aria-hidden
          >
            <path
              d="M2 12 C 8 4, 14 18, 22 8 S 38 4, 50 14"
              fill="none"
              stroke="#0f172a"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <span className={homeStyles.mockDiplomaSignatureName}>
            Recursalia Elite Team
          </span>
        </div>
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

function JourneyConnector({ active }: { active: boolean }) {
  // Línea estirable + flecha de tamaño fijo:
  //   - "guides" (dashed) y "trail" (sólido fluor) usan pathLength=1
  //     → animamos stroke-dashoffset de 1 → 0.
  //   - La flecha vive en su propio SVG no estirable, anclada al final
  //     del wrap, así no se deforma cuando el conector es muy alto.
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
    <>
      <svg
        className={homeStyles.journeyConnectorLine}
        viewBox="0 0 10 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          className={homeStyles.journeyConnectorGuides}
          d="M5 0 L5 100"
          fill="none"
          strokeLinecap="round"
        />
        <path
          className={homeStyles.journeyConnectorTrail}
          d="M5 0 L5 100"
          fill="none"
          strokeLinecap="round"
          pathLength={1}
          style={trailStyle}
        />
      </svg>
      <svg
        className={homeStyles.journeyConnectorArrowSvg}
        viewBox="0 0 24 14"
        aria-hidden
      >
        <path
          className={homeStyles.journeyConnectorArrow}
          d="M5 3 L12 12 L19 3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={arrowStyle}
        />
      </svg>
    </>
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
                <JourneyConnector active={!!nextRevealed} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
