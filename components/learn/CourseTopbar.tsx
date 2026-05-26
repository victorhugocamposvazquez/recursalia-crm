'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import styles from './CourseTopbar.module.css';
import type { Module } from '@/components/learn/types';

export type CourseQuizEntry = {
  id: string;
  title: string;
  topic_id: string | null;
  is_final: boolean;
};

type Props = {
  courseSlug: string;
  courseTitle: string;
  courseCompletion: number;
  modules: Module[];
  quizzes: CourseQuizEntry[];
};

type Crumb = {
  /** Línea superior: tags pequeños (ej: "MÓDULO 02 · LECCIÓN 2.3"). */
  eyebrow: React.ReactNode;
  /** Título grande de la fila (ej: nombre de la lección o quiz). */
  title: string;
  /** Texto opcional a la derecha (ej: "3/24"). */
  counter?: string;
  /** Si es ruta de lectura larga: barra de progreso de scroll visible. */
  isLesson?: boolean;
  /** Lección anterior / siguiente (UUIDs) para la fila 2 móvil. */
  prevLessonId?: string | null;
  nextLessonId?: string | null;
};

function findLessonCtx(modules: Module[], lessonId: string) {
  for (const m of modules) {
    const idx = m.lessons.findIndex((l) => l.id === lessonId);
    if (idx >= 0) {
      return { module: m, lesson: m.lessons[idx], lessonIdx: idx };
    }
  }
  return null;
}

function flatLessons(modules: Module[]) {
  return modules.flatMap((m) => m.lessons);
}

function deriveCrumb(args: {
  pathname: string;
  courseTitle: string;
  modules: Module[];
  quizzes: CourseQuizEntry[];
}): Crumb {
  const { pathname, courseTitle, modules, quizzes } = args;

  // /aprender/cursos/[slug]/lecciones/[lessonId]
  const lessonMatch = pathname.match(/\/aprender\/cursos\/[^/]+\/lecciones\/([^/]+)/);
  if (lessonMatch) {
    const lessonId = lessonMatch[1];
    const ctx = findLessonCtx(modules, lessonId);
    if (ctx) {
      const flat = flatLessons(modules);
      const pos = flat.findIndex((l) => l.id === lessonId);
      const prev = pos > 0 ? flat[pos - 1] : null;
      const next = pos >= 0 && pos < flat.length - 1 ? flat[pos + 1] : null;
      return {
        eyebrow: (
          <>
            <span className={styles.eyebrowMod}>
              Módulo {String(ctx.module.n).padStart(2, '0')}
            </span>
            <span className={styles.eyebrowSep}>·</span>
            <span>Lección {ctx.lesson.code ?? `${ctx.module.n}.${ctx.lessonIdx + 1}`}</span>
            <span className={styles.eyebrowSep}>·</span>
            <span>{courseTitle}</span>
          </>
        ),
        title: ctx.lesson.title,
        counter: `${pos + 1}/${flat.length}`,
        isLesson: true,
        prevLessonId: prev?.state === 'locked' ? null : (prev?.id ?? null),
        nextLessonId: next?.state === 'locked' ? null : (next?.id ?? null),
      };
    }
    return { eyebrow: <span>{courseTitle}</span>, title: 'Lección' };
  }

  // /aprender/cursos/[slug]/quiz/[quizId]
  const quizMatch = pathname.match(/\/aprender\/cursos\/[^/]+\/quiz\/([^/]+)/);
  if (quizMatch) {
    const quizId = quizMatch[1];
    const quiz = quizzes.find((q) => q.id === quizId);
    if (quiz) {
      const topicIdx = quiz.topic_id
        ? modules.findIndex((m) => m.topicId === quiz.topic_id)
        : -1;
      const moduleN = topicIdx >= 0 ? modules[topicIdx].n : null;
      return {
        eyebrow: (
          <>
            <span className={styles.eyebrowMod}>Quiz</span>
            {moduleN ? (
              <>
                <span className={styles.eyebrowSep}>·</span>
                <span>Módulo {String(moduleN).padStart(2, '0')}</span>
              </>
            ) : null}
            <span className={styles.eyebrowSep}>·</span>
            <span>{courseTitle}</span>
          </>
        ),
        title: quiz.title,
      };
    }
    return { eyebrow: <span>{courseTitle}</span>, title: 'Quiz' };
  }

  // /aprender/cursos/[slug]/examen
  if (/\/aprender\/cursos\/[^/]+\/examen/.test(pathname)) {
    return {
      eyebrow: (
        <>
          <span className={styles.eyebrowMod}>Examen final</span>
          <span className={styles.eyebrowSep}>·</span>
          <span>{courseTitle}</span>
        </>
      ),
      title: 'Pon a prueba todo el curso',
    };
  }

  // /aprender/cursos/[slug]/resultados/...
  if (/\/aprender\/cursos\/[^/]+\/resultados\//.test(pathname)) {
    return {
      eyebrow: (
        <>
          <span className={styles.eyebrowMod}>Resultado</span>
          <span className={styles.eyebrowSep}>·</span>
          <span>{courseTitle}</span>
        </>
      ),
      title: 'Tu intento',
    };
  }

  // /aprender/cursos/[slug] (hub del curso)
  return {
    eyebrow: <span className={styles.eyebrowMod}>Curso</span>,
    title: courseTitle,
  };
}

/** Calcula el `pct` de scroll global del documento. */
function useDocumentScrollPct(active: boolean): number {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (!active) {
      setPct(0);
      return;
    }
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setPct(max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [active]);
  return pct;
}

export function CourseTopbar({
  courseSlug,
  courseTitle,
  courseCompletion,
  modules,
  quizzes,
}: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? '';

  const crumb = useMemo(
    () => deriveCrumb({ pathname, courseTitle, modules, quizzes }),
    [pathname, courseTitle, modules, quizzes]
  );

  // En quizzes y examen el QuizPlayer ya monta su propio HUD contextual
  // (vidas, combo, XP, progreso, botón salir). Si pintáramos también el
  // CourseTopbar encima, el HUD del juego quedaría tapado al hacer scroll.
  // Ocultamos el topbar global para esas rutas.
  const isQuizRoute =
    /\/aprender\/cursos\/[^/]+\/(quiz|examen)(\/|$)/.test(pathname);

  // Si la ruta es el hub, "Volver" sale del curso (a /aprender).
  // Si es lección/quiz/examen/resultados, "Volver" lleva al hub del curso.
  const isHub =
    /^\/aprender\/cursos\/[^/]+\/?$/.test(pathname) ||
    pathname === `/aprender/cursos/${courseSlug}`;

  const backHref = isHub ? '/aprender' : `/aprender/cursos/${courseSlug}`;
  const backLabel = isHub ? 'Mis cursos' : 'Curso';

  const readingPct = useDocumentScrollPct(Boolean(crumb.isLesson));

  // Después de todos los hooks: si estamos en quiz/examen, no renderizar nada.
  if (isQuizRoute) return null;

  return (
    <header className={styles.bar} role="banner">
      <div className={styles.inner}>
        <button
          type="button"
          className={styles.back}
          onClick={() => router.push(backHref)}
          aria-label={`Volver a ${backLabel}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M15 5l-7 7 7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.backLabel}>{backLabel}</span>
        </button>

        <Link
          href="/aprender"
          className={styles.brandMark}
          aria-label="Inicio Recursalia Aprender"
          title="Inicio"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 2L21 7V17L12 22L3 17V7L12 2Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M7 10L12 12.5L17 10"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <div className={styles.center}>
          <div className={styles.eyebrow}>{crumb.eyebrow}</div>
          <div className={styles.title}>{crumb.title}</div>
        </div>

        <div className={styles.right}>
          {crumb.counter ? (
            <span className={styles.counter} aria-label="Posición en el curso">
              {crumb.counter}
            </span>
          ) : null}
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => router.push('/aprender/cuenta')}
            aria-label="Mi cuenta"
            title="Mi cuenta"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M4 21a8 8 0 0116 0"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {!crumb.isLesson && isHub ? (
        <div className={styles.row2}>
          <span className={styles.completionPill}>
            <span className={styles.completionTrack}>
              <span
                className={styles.completionFill}
                style={{ width: `${Math.round(courseCompletion * 100)}%` }}
              />
            </span>
            <span>{Math.round(courseCompletion * 100)}% completado</span>
          </span>
        </div>
      ) : null}

      {crumb.isLesson ? (
        <div
          role="progressbar"
          aria-valuenow={Math.round(readingPct * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso de lectura"
          className={styles.progressTrack}
        >
          <div
            className={styles.progressFill}
            style={{
              width: `${Math.max(readingPct * 100, readingPct > 0 ? 2 : 0)}%`,
            }}
          />
        </div>
      ) : null}
    </header>
  );
}
