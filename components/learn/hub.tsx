// @ts-nocheck — see README for typing guidance on internal helpers
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useTheme, Logo, Icon, Button, Progress, Chip, Mono, fmt } from './tokens';
import { mockCourse, mockModules } from '@/lib/learn-mock';
import { useLearnDataOptional } from '@/lib/learn/context';
import type { TweakOptions } from './types';

/* components/learn/hub.tsx — Hub del curso (desktop + mobile)
   El estudiante entra aquí: ve su progreso, qué tiene que ver hoy, todos los
   módulos y lecciones. La gamificación está presente pero discreta (XP + racha
   en el sidebar/topbar). Editorial: tipografía protagonista, mucho aire, una
   regla horizontal entre módulos. */

  const BRAND = '#1b38c4';

  // Tipografía para el id de lección (mono, color acento)
  const kindIcon = {
    video: 'play',
    text:  'doc',
    audio: 'headphones',
    quiz:  'target',
    boss:  'trophy',
  };
  const kindLabel = {
    video: 'Vídeo',
    text:  'Lectura',
    audio: 'Audio',
    quiz:  'Quiz',
    boss:  'Examen',
  };

  // Tarjeta de lección dentro de un módulo
  function LessonRow({ l, t, accent, compact, onOpen }) {
    const isCurrent = l.state === 'current';
    const isDone = l.state === 'done';
    const isLocked = l.state === 'locked';
    const isQuiz = l.kind === 'quiz' || l.kind === 'boss';

    const statusDot = (() => {
      if (isDone) return (
        <div style={{ width: 26, height: 26, borderRadius: 13, background: accent.bg, color: accent.fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name="check" size={14} sw={2.5}/>
        </div>
      );
      if (isCurrent) return (
        <div style={{ width: 26, height: 26, borderRadius: 13, border: `2px solid ${BRAND}`, display: 'grid', placeItems: 'center', flexShrink: 0, position: 'relative' }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: BRAND, animation: 'rx-pulse 1.6s ease-in-out infinite' }}/>
        </div>
      );
      if (isLocked) return (
        <div style={{ width: 26, height: 26, borderRadius: 13, border: `1.5px dashed ${t.line}`, color: t.faint, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name="lock" size={12}/>
        </div>
      );
      return (
        <div style={{ width: 26, height: 26, borderRadius: 13, border: `1.5px solid ${t.line}`, flexShrink: 0 }}/>
      );
    })();

    return (
      <button
        type="button"
        disabled={isLocked}
        onClick={() => { if (!isLocked) onOpen?.(); }}
        style={{
          display: 'flex', alignItems: 'center', gap: compact ? 10 : 14,
          padding: compact ? '12px 14px' : '14px 16px',
          width: '100%', textAlign: 'left',
          background: isCurrent ? (t.dark ? 'rgba(255,255,255,0.04)' : '#FFF') : 'transparent',
          border: isCurrent ? `1.5px solid ${BRAND}` : '1px solid transparent',
          borderRadius: 14, cursor: isLocked ? 'not-allowed' : 'pointer',
          color: 'inherit', fontFamily: 'inherit',
          transition: 'background .15s ease, border-color .15s ease',
          opacity: isLocked ? 0.55 : 1,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {statusDot}
        <Mono color={t.faint} style={{ width: compact ? 26 : 30, flexShrink: 0, fontSize: compact ? 11 : undefined }}>{l.code ?? l.id}</Mono>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: compact ? 14 : 15.5, color: isCurrent ? BRAND : t.ink, letterSpacing: -0.2, lineHeight: 1.25, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {l.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, color: t.muted, fontSize: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name={kindIcon[l.kind]} size={12}/> {kindLabel[l.kind]}
            </span>
            <span style={{ color: t.faint }}>·</span>
            <span>{l.dur}</span>
            {isQuiz && l.score != null && (
              <>
                <span style={{ color: t.faint }}>·</span>
                <span style={{ color: accent.bg === '#C8F542' ? (t.dark ? accent.bg : '#5A7B0E') : accent.bg, fontWeight: 600 }}>
                  {l.score}/6 ★
                </span>
              </>
            )}
          </div>
        </div>
        {isCurrent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: BRAND, fontWeight: 600, fontSize: 12, flexShrink: 0 }}>
            <span>Continuar</span>
            <Icon name="arrowR" size={14}/>
          </div>
        )}
      </button>
    );
  }

  // Encabezado de módulo
  function ModuleHeader({ m, t, accent, completedCount, totalCount, isFinal }) {
    const pct = totalCount > 0 ? completedCount / totalCount : 0;
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 14 }}>
        <div style={{ flexShrink: 0, paddingTop: 2 }}>
          <Mono color={t.faint} size={11}>Módulo · {String(m.n).padStart(2,'0')}</Mono>
          {!isFinal && (
            <div style={{ marginTop: 8, width: 56, height: 56, borderRadius: 28, display: 'grid', placeItems: 'center', background: pct === 1 ? accent.bg : 'transparent', color: pct === 1 ? accent.fg : t.ink, border: pct === 1 ? 'none' : `1.5px solid ${t.line}`, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18 }}>
              {pct === 1 ? <Icon name="check" size={22} sw={3}/> : `${Math.round(pct * 100)}%`}
            </div>
          )}
          {isFinal && (
            <div style={{ marginTop: 8, width: 56, height: 56, borderRadius: 28, display: 'grid', placeItems: 'center', background: BRAND, color: '#ffffff' }}>
              <Icon name="trophy" size={22} sw={2}/>
            </div>
          )}
        </div>
        <div style={{ flex: 1, paddingTop: 2 }}>
          <h3 style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 700, color: BRAND, letterSpacing: -0.8, lineHeight: 1.1 }}>
            {m.title}
          </h3>
          <p style={{ margin: '6px 0 0', color: t.muted, fontSize: 14.5, lineHeight: 1.5, maxWidth: 520 }}>
            {m.summary}
          </p>
        </div>
      </div>
    );
  }

  // Tarjeta «continuar» con datos reales del contexto
  function ContinueCard({ t, accent, course, currentLesson, onResume, mobile }) {
    const title = currentLesson?.title ?? 'Empezar curso';
    const meta = currentLesson
      ? `${currentLesson.code ? `Lección ${currentLesson.code}` : 'Lección'} · ${currentLesson.dur}`
      : `${Math.round(course.completion * 100)}% completado`;
    return (
      <div style={{
        width: mobile ? '100%' : 320,
        padding: mobile ? 18 : 22,
        borderRadius: 18,
        background: `linear-gradient(145deg, ${BRAND} 0%, #142a99 100%)`,
        color: '#ffffff',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 16px 40px -16px rgb(27 56 196 / 45%)',
      }}>
        <div style={{ position: 'absolute', top: mobile ? -30 : -40, right: mobile ? -30 : -40, width: mobile ? 120 : 160, height: mobile ? 120 : 160, borderRadius: '50%', background: 'radial-gradient(circle, rgb(255 255 255 / 18%), transparent 70%)' }}/>
        <Mono color="rgb(255 255 255 / 75%)" size={mobile ? 9 : 10}>CONTINÚA DONDE LO DEJASTE</Mono>
        <div style={{ marginTop: mobile ? 8 : 10, fontSize: mobile ? 18 : 20, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.2, color: '#ffffff' }}>
          {title}
        </div>
        <div style={{ marginTop: 6, fontSize: mobile ? 12 : 13, color: 'rgb(255 255 255 / 72%)' }}>{meta}</div>
        <div style={{ marginTop: mobile ? 14 : 16 }}>
          <Progress value={course.completion} color="#ffffff" track="rgba(255,255,255,0.22)" height={mobile ? 4 : 5}/>
        </div>
        <div style={{ position: 'relative', zIndex: 1, marginTop: mobile ? 14 : 18 }}>
          <Button bg="#ffffff" fg={BRAND} icon="play" size={mobile ? 'sm' : 'md'} style={{ width: '100%', justifyContent: 'center' }} onClick={onResume}>
            {currentLesson ? 'Reanudar lección' : 'Ir al curso'}
          </Button>
        </div>
      </div>
    );
  }

  function resumeCurrent(currentLesson, openLesson, startExam, modules) {
    if (currentLesson) {
      if (currentLesson.kind === 'boss') {
        startExam?.();
        return;
      }
      for (const m of modules ?? []) {
        const found = m.lessons?.find(l => l.id === currentLesson.id);
        if (found && found.state !== 'locked') {
          openLesson(found);
          return;
        }
      }
      return;
    }
    for (const m of modules ?? []) {
      for (const l of m.lessons ?? []) {
        if (l.state !== 'locked' && l.kind !== 'boss') {
          openLesson(l);
          return;
        }
      }
    }
  }
  function useHubNavigation(learn) {
    const router = useRouter();
    const courseSlug = learn?.courseSlug;
    const onLessonOpen = learn?.onLessonOpen;
    const onOpenTopicQuiz = learn?.onOpenTopicQuiz;
    const onStartExam = learn?.onStartExam;
    const examUnlocked = learn?.examUnlocked;
    const quizByLesson = learn?.quizByLesson ?? {};

    const openLesson = (l) => {
      if (l.state === 'locked') return;
      if (onLessonOpen) {
        onLessonOpen(l.id, l.kind);
        return;
      }
      if (!courseSlug) return;
      if (l.kind === 'quiz') {
        const qid = quizByLesson[l.id] ?? l.id;
        router.push(`/aprender/cursos/${courseSlug}/quiz/${qid}`);
      } else if (l.kind === 'boss') {
        if (examUnlocked) router.push(`/aprender/cursos/${courseSlug}/examen`);
      } else {
        router.push(`/aprender/cursos/${courseSlug}/lecciones/${l.id}`);
      }
    };

    const openTopicQuiz = (quizId) => {
      if (onOpenTopicQuiz) {
        onOpenTopicQuiz(quizId);
        return;
      }
      if (courseSlug) router.push(`/aprender/cursos/${courseSlug}/quiz/${quizId}`);
    };

    const startExam = () => {
      if (onStartExam) {
        onStartExam();
        return;
      }
      if (courseSlug && examUnlocked) router.push(`/aprender/cursos/${courseSlug}/examen`);
    };

    return { openLesson, openTopicQuiz, startExam };
  }

  // ── HUB DESKTOP ────────────────────────────────────────────────────────────
  export function HubDesktop({ tweak }: { tweak?: TweakOptions }) {
    const learn = useLearnDataOptional();
    const course = learn?.course ?? mockCourse;
    const modules = learn?.modules ?? mockModules;
    const currentLesson = learn?.currentLesson;
    const examUnlocked = learn?.examUnlocked;
    const quizByTopic = learn?.quizByTopic ?? {};
    const finalQuizMeta = learn?.finalQuizMeta ?? null;
    const { openLesson, openTopicQuiz, startExam } = useHubNavigation(learn);
    const lessonStats = modules.reduce((acc, m) => {
      acc.total += m.lessons.length;
      acc.done += m.lessons.filter(l => l.state === 'done').length;
      return acc;
    }, { total: 0, done: 0 });
    const t = useTheme(tweak);
    const { A: accent } = t;

    return (
      <div style={{ width: '100%', minHeight: '100%', background: t.bg, color: t.ink, fontFamily: t.sans, display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: '100%', maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
          {/* Hero del curso */}
          <section style={{ padding: '32px 0 36px', borderBottom: `1px solid ${t.line}`, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <Chip mono size="sm" color={t.muted} border={`1px solid ${t.line}`}>{course.tag}</Chip>
                  <Chip mono size="sm" color={t.muted} border={`1px solid ${t.line}`}>{course.level.toUpperCase()}</Chip>
                  <Mono color={t.faint}>· {course.lessons} lecciones · {course.duration}</Mono>
                </div>
                <h1 style={{ margin: 0, fontFamily: t.sans, fontSize: 44, fontWeight: 800, color: BRAND, letterSpacing: -1.6, lineHeight: 1.02, maxWidth: 640 }}>
                  {course.title}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 18, background: `linear-gradient(135deg, ${accent.bg}, #1b38c4)`, flexShrink: 0 }}/>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: t.ink }}>{course.instructor}</div>
                    <div style={{ fontSize: 12, color: t.muted }}>{course.instructorRole}</div>
                  </div>
                </div>
              </div>

              <ContinueCard
                t={t}
                accent={accent}
                course={course}
                currentLesson={currentLesson}
                onResume={() => resumeCurrent(currentLesson, openLesson, startExam, modules)}
              />
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 32, marginTop: 32, paddingTop: 22, borderTop: `1px solid ${t.line}` }}>
              <Stat t={t} label="Progreso del curso" value={`${Math.round(course.completion * 100)}%`} sub={
                <Progress value={course.completion} color={accent.bg} height={4} style={{ marginTop: 8, maxWidth: 180 }}/>
              }/>
              <Stat t={t} label="Racha actual" value={`${course.streak} días`} sub={<span style={{ fontSize: 12, color: t.muted }}>Sigue estudiando hoy</span>}/>
              <Stat t={t} label="Lecciones" value={`${lessonStats.done}/${lessonStats.total}`} sub={<span style={{ fontSize: 12, color: t.muted }}>completadas</span>}/>
            </div>
          </section>

          {/* Módulos */}
          <section style={{ padding: '36px 0 60px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
              <div>
                <Mono color={t.faint}>{modules.length} MÓDULOS · {lessonStats.total} LECCIONES</Mono>
                <h2 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: BRAND }}>Tu camino</h2>
              </div>
              <button style={{ background: 'none', border: 'none', color: t.muted, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Colapsar todo <Icon name="chevU" size={14}/>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
              {modules.map((m, mi) => {
                const completed = m.lessons.filter(l => l.state === 'done').length;
                const moduleQuiz = m.topicId ? quizByTopic[m.topicId] : null;
                const moduleQuizUnlocked = m.lessons.every(l => l.state === 'done');
                return (
                  <div key={m.n} style={{ paddingBottom: mi < modules.length - 1 ? 12 : 0, borderBottom: mi < modules.length - 1 ? `1px solid ${t.line}` : 'none' }}>
                    <ModuleHeader m={m} t={t} accent={accent} completedCount={completed} totalCount={m.lessons.length} isFinal={m.isFinal}/>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginLeft: 74 }}>
                      {m.lessons.map(l => (
                        <LessonRow key={l.id} l={l} t={t} accent={accent} onOpen={() => openLesson(l)}/>
                      ))}
                    </div>
                    {!m.isFinal && moduleQuiz ? (
                      <div style={{ marginLeft: 74 }}>
                        <ModuleQuizRow t={t} accent={accent} quiz={moduleQuiz} unlocked={moduleQuizUnlocked} onOpen={() => openTopicQuiz(moduleQuiz.id)}/>
                      </div>
                    ) : null}
                    {m.isFinal ? (
                      <BossCard t={t} accent={accent} title={finalQuizMeta?.title ?? 'Examen final del curso'} questionCount={finalQuizMeta?.question_count ?? 0} unlocked={examUnlocked} onOpen={startExam} mobile={false}/>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <style>{`
          @keyframes rx-pulse { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.4); opacity: .55 } }
        `}</style>
      </div>
    );
  };

  function Stat({ t, label, value, sub }) {
    return (
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.2, color: t.faint, textTransform: 'uppercase' }}>
          {label}
        </div>
        <div style={{ marginTop: 6, fontSize: 26, fontWeight: 700, letterSpacing: -0.6, color: t.ink, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ marginTop: 4 }}>{sub}</div>
      </div>
    );
  }

  function BossCard({ t, accent, title, questionCount, unlocked, onOpen, mobile }) {
    return (
      <div style={{
        marginLeft: mobile ? 0 : 74,
        marginTop: mobile ? 10 : 0,
        padding: mobile ? '16px 14px' : 22,
        borderRadius: 18,
        background: t.dark ? 'rgba(255,255,255,0.03)' : '#FFF',
        border: `1.5px dashed rgb(27 56 196 / 28%)`,
        display: 'flex',
        flexDirection: mobile ? 'column' : 'row',
        alignItems: mobile ? 'stretch' : 'center',
        gap: mobile ? 14 : 18,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Chip mono size="sm" bg={BRAND} color="#ffffff">EXAMEN FINAL</Chip>
            {questionCount > 0 ? (
              <Mono color={t.faint}>{questionCount} preguntas</Mono>
            ) : null}
          </div>
          <div style={{ marginTop: 8, fontSize: mobile ? 16 : 18, fontWeight: 700, letterSpacing: -0.4, color: BRAND }}>{title ?? 'Examen final del curso'}</div>
          <div style={{ marginTop: 4, fontSize: 13, color: t.muted, maxWidth: 480, lineHeight: 1.5 }}>
            {unlocked
              ? 'Has completado todas las lecciones. Aprueba con 70% para obtener tu diploma.'
              : 'Completa todas las lecciones del curso para desbloquear el examen.'}
          </div>
        </div>
        {unlocked ? (
          <Button bg={BRAND} fg="#ffffff" icon="play" onClick={onOpen} style={mobile ? { width: '100%', justifyContent: 'center' } : undefined}>
            Empezar examen
          </Button>
        ) : (
          <Button kind="ghost" iconRight="lock" disabled style={{ color: t.muted, borderColor: t.line, ...(mobile ? { width: '100%', justifyContent: 'center' } : {}) }}>
            Bloqueado
          </Button>
        )}
      </div>
    );
  }

  function ModuleQuizRow({ t, accent, quiz, unlocked, onOpen }) {
    const passed = quiz.bestScore != null && quiz.bestScore >= (quiz.pass_threshold ?? 0.7);
    return (
      <button
        type="button"
        disabled={!unlocked}
        onClick={() => { if (unlocked) onOpen?.(); }}
        style={{
          width: '100%',
          marginTop: 12, padding: '14px 16px', borderRadius: 14,
          background: t.dark ? 'rgba(255,255,255,0.03)' : t.surface2,
          border: `1px solid ${t.line}`,
          display: 'flex', alignItems: 'center', gap: 14,
          cursor: unlocked ? 'pointer' : 'not-allowed',
          opacity: unlocked ? 1 : 0.7,
          textAlign: 'left', color: 'inherit', fontFamily: 'inherit',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 18,
          background: passed ? accent.bg : (unlocked ? '#1b38c4' : t.lineSoft),
          color: passed ? accent.fg : (unlocked ? '#FFF' : t.faint),
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <Icon name={passed ? 'check' : 'target'} size={16} sw={2.5}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Mono color={t.faint} size={10}>QUIZ DEL MÓDULO</Mono>
            {quiz.question_count > 0 ? <Mono color={t.faint} size={10}>· {quiz.question_count} preguntas</Mono> : null}
          </div>
          <div style={{ fontWeight: 600, fontSize: 14.5, color: t.ink, letterSpacing: -0.2 }}>
            {quiz.title}
          </div>
          {quiz.bestScore != null ? (
            <div style={{ marginTop: 2, fontSize: 12, color: passed ? (accent.bg === '#C8F542' ? '#5A7B0E' : accent.bg) : t.muted, fontWeight: 600 }}>
              Mejor resultado: {Math.round(quiz.bestScore * 100)}% {passed ? '· Aprobado' : '· Inténtalo de nuevo'}
            </div>
          ) : (
            <div style={{ marginTop: 2, fontSize: 12, color: t.muted }}>
              {unlocked ? 'Pon a prueba lo que has aprendido en este módulo.' : 'Completa las lecciones del módulo para desbloquear.'}
            </div>
          )}
        </div>
        {unlocked ? (
          <Icon name="arrowR" size={16}/>
        ) : (
          <Icon name="lock" size={14}/>
        )}
      </button>
    );
  }

  // ── HUB MOBILE ─────────────────────────────────────────────────────────────
  export function HubMobile({ tweak }: { tweak?: TweakOptions }) {
    const learn = useLearnDataOptional();
    const course = learn?.course ?? mockCourse;
    const modules = learn?.modules ?? mockModules;
    const currentLesson = learn?.currentLesson;
    const examUnlocked = learn?.examUnlocked;
    const quizByTopic = learn?.quizByTopic ?? {};
    const finalQuizMeta = learn?.finalQuizMeta ?? null;
    const { openLesson, openTopicQuiz, startExam } = useHubNavigation(learn);
    const lessonStats = modules.reduce((acc, m) => {
      acc.total += m.lessons.length;
      acc.done += m.lessons.filter(l => l.state === 'done').length;
      return acc;
    }, { total: 0, done: 0 });
    const t = useTheme(tweak);
    const { A: accent } = t;

    return (
      <div style={{ width: '100%', minHeight: '100%', background: t.bg, color: t.ink, fontFamily: t.sans, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Top bar */}
        <div style={{ padding: '14px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          <Chip size="sm" bg={accent.bg} color={accent.fg} icon="fire">{course.streak}</Chip>
          <Chip size="sm" border={`1px solid ${t.line}`} color={t.ink} icon="bolt">{fmt.n(course.xp)}</Chip>
        </div>

        <div style={{ flex: 1, padding: '20px 18px 40px' }}>
          {/* Header curso */}
          <div>
            <Mono color={t.faint}>{course.tag} · {course.level.toUpperCase()}</Mono>
            <h1 style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: -1, lineHeight: 1.05, color: BRAND }}>
              {course.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: `linear-gradient(135deg, ${accent.bg}, #1b38c4)` }}/>
              <div style={{ fontSize: 13, color: t.muted }}>
                <span style={{ color: t.ink, fontWeight: 600 }}>{course.instructor}</span> · {course.duration}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
          <ContinueCard
            t={t}
            accent={accent}
            course={course}
            currentLesson={currentLesson}
            onResume={() => resumeCurrent(currentLesson, openLesson, startExam, modules)}
            mobile
          />
          </div>

          {/* Progreso */}
          <div style={{ marginTop: 22, padding: '14px 16px', borderRadius: 14, background: t.surface, border: `1px solid ${t.line}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Mono color={t.faint}>TU PROGRESO</Mono>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{Math.round(course.completion*100)}%</span>
            </div>
            <Progress value={course.completion} color={accent.bg} height={5} style={{ marginTop: 8 }}/>
            <div style={{ marginTop: 8, fontSize: 12, color: t.muted }}>{lessonStats.done} de {lessonStats.total} lecciones</div>
          </div>

          <div style={{ marginTop: 28 }}>
            <Mono color={t.faint}>TU CAMINO</Mono>
            <h2 style={{ margin: '4px 0 18px', fontSize: 18, fontWeight: 700, letterSpacing: -0.4, color: BRAND }}>
              {modules.length} módulos · {lessonStats.total} lecciones
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {modules.map(m => {
                const completed = m.lessons.filter(l => l.state === 'done').length;
                const pct = m.lessons.length ? completed / m.lessons.length : 0;
                const moduleQuiz = m.topicId ? quizByTopic[m.topicId] : null;
                const moduleQuizUnlocked = m.lessons.every(l => l.state === 'done');
                return (
                  <div key={m.n}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 14, display: 'grid', placeItems: 'center', background: m.isFinal ? BRAND : (pct === 1 ? accent.bg : 'transparent'), color: m.isFinal ? '#ffffff' : (pct === 1 ? accent.fg : BRAND), border: (pct === 1 || m.isFinal) ? 'none' : `1.5px solid ${t.line}`, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {pct === 1 && !m.isFinal ? <Icon name="check" size={14} sw={3}/> : (m.isFinal ? <Icon name="trophy" size={14}/> : String(m.n).padStart(2,'0'))}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3, color: BRAND, lineHeight: 1.25 }}>{m.title}</div>
                      </div>
                      {!m.isFinal && <span style={{ fontSize: 11, color: t.muted, fontFamily: t.mono }}>{completed}/{m.lessons.length}</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {m.lessons.map(l => (
                        <LessonRow key={l.id} l={l} t={t} accent={accent} compact onOpen={() => openLesson(l)}/>
                      ))}
                      {!m.isFinal && moduleQuiz ? (
                        <div style={{ marginTop: 8 }}>
                          <ModuleQuizRow t={t} accent={accent} quiz={moduleQuiz} unlocked={moduleQuizUnlocked} onOpen={() => openTopicQuiz(moduleQuiz.id)}/>
                        </div>
                      ) : null}
                      {m.isFinal ? (
                        <BossCard t={t} accent={accent} title={finalQuizMeta?.title ?? 'Examen final del curso'} questionCount={finalQuizMeta?.question_count ?? 0} unlocked={examUnlocked} onOpen={startExam} mobile/>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <style>{`@keyframes rx-pulse { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.4); opacity: .55 } }`}</style>
      </div>
    );
  };
