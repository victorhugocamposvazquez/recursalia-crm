// @ts-nocheck — see README for typing guidance on internal helpers
'use client';
import React from 'react';
import { useTheme, Logo, Icon, Button, Progress, Chip, Mono, fmt } from './tokens';
import { mockCourse, mockModules } from '@/lib/learn-mock';
import { useLearnDataOptional } from '@/lib/learn/context';
import type { TweakOptions } from './types';

/* components/learn/hub.tsx — Hub del curso (desktop + mobile)
   El estudiante entra aquí: ve su progreso, qué tiene que ver hoy, todos los
   módulos y lecciones. La gamificación está presente pero discreta (XP + racha
   en el sidebar/topbar). Editorial: tipografía protagonista, mucho aire, una
   regla horizontal entre módulos. */

// ── ELEMENTOS COMUNES ──────────────────────────────────────────────────────

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
        <div style={{ width: 26, height: 26, borderRadius: 13, border: `2px solid ${t.ink}`, display: 'grid', placeItems: 'center', flexShrink: 0, position: 'relative' }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: t.ink, animation: 'rx-pulse 1.6s ease-in-out infinite' }}/>
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
        onClick={onOpen}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: compact ? '10px 12px' : '14px 16px',
          width: '100%', textAlign: 'left',
          background: isCurrent ? (t.dark ? 'rgba(255,255,255,0.04)' : '#FFF') : 'transparent',
          border: isCurrent ? `1px solid ${t.line}` : '1px solid transparent',
          borderRadius: 14, cursor: isLocked ? 'not-allowed' : 'pointer',
          color: 'inherit', fontFamily: 'inherit',
          transition: 'background .15s ease',
          opacity: isLocked ? 0.55 : 1,
        }}
      >
        {statusDot}
        <Mono color={t.faint} style={{ width: 30, flexShrink: 0 }}>{l.code ?? l.id}</Mono>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: compact ? 14 : 15.5, color: t.ink, letterSpacing: -0.2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.ink, fontWeight: 600, fontSize: 12 }}>
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
            <div style={{ marginTop: 8, width: 56, height: 56, borderRadius: 28, display: 'grid', placeItems: 'center', background: t.ink, color: t.bg }}>
              <Icon name="trophy" size={22} sw={2}/>
            </div>
          )}
        </div>
        <div style={{ flex: 1, paddingTop: 2 }}>
          <h3 style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 700, color: t.ink, letterSpacing: -0.8, lineHeight: 1.1 }}>
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
        background: t.ink,
        color: t.bg,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: mobile ? -30 : -40, right: mobile ? -30 : -40, width: mobile ? 120 : 160, height: mobile ? 120 : 160, borderRadius: '50%', background: `radial-gradient(circle, ${accent.bg}66, transparent 70%)` }}/>
        <Mono color={accent.bg} size={mobile ? 9 : 10}>CONTINÚA DONDE LO DEJASTE</Mono>
        <div style={{ marginTop: mobile ? 8 : 10, fontSize: mobile ? 18 : 20, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.2 }}>
          {title}
        </div>
        <div style={{ marginTop: 6, fontSize: mobile ? 12 : 13, opacity: 0.7 }}>{meta}</div>
        <div style={{ marginTop: mobile ? 14 : 16 }}>
          <Progress value={course.completion} color={accent.bg} track="rgba(255,255,255,0.15)" height={mobile ? 4 : 5}/>
        </div>
        <div style={{ position: 'relative', zIndex: 1, marginTop: mobile ? 14 : 18 }}>
          <Button bg={accent.bg} fg={accent.fg} icon="play" size={mobile ? 'sm' : 'md'} style={{ width: '100%', justifyContent: 'center' }} onClick={onResume}>
            {currentLesson ? 'Reanudar lección' : 'Ir al curso'}
          </Button>
        </div>
      </div>
    );
  }

  function resumeCurrent(currentLesson, onLessonOpen, onStartExam) {
    if (!currentLesson) return;
    if (currentLesson.kind === 'boss') {
      onStartExam?.();
      return;
    }
    onLessonOpen?.(currentLesson.id, currentLesson.kind);
  }

  // ── HUB DESKTOP ────────────────────────────────────────────────────────────
  export function HubDesktop({ tweak }: { tweak?: TweakOptions }) {
    const learn = useLearnDataOptional();
    const course = learn?.course ?? mockCourse;
    const modules = learn?.modules ?? mockModules;
    const onLessonOpen = learn?.onLessonOpen;
    const onGoHome = learn?.onGoHome;
    const onStartExam = learn?.onStartExam;
    const currentLesson = learn?.currentLesson;
    const examUnlocked = learn?.examUnlocked;
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
                <h1 style={{ margin: 0, fontFamily: t.sans, fontSize: 44, fontWeight: 800, color: t.ink, letterSpacing: -1.6, lineHeight: 1.02, maxWidth: 640 }}>
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
                onResume={() => resumeCurrent(currentLesson, onLessonOpen, onStartExam)}
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
                <h2 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>Tu camino</h2>
              </div>
              <button style={{ background: 'none', border: 'none', color: t.muted, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Colapsar todo <Icon name="chevU" size={14}/>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
              {modules.map((m, mi) => {
                const completed = m.lessons.filter(l => l.state === 'done').length;
                return (
                  <div key={m.n} style={{ paddingBottom: mi < modules.length - 1 ? 12 : 0, borderBottom: mi < modules.length - 1 ? `1px solid ${t.line}` : 'none' }}>
                    <ModuleHeader m={m} t={t} accent={accent} completedCount={completed} totalCount={m.lessons.length} isFinal={m.isFinal}/>
                    {m.isFinal ? (
                      <BossCard t={t} accent={accent} l={m.lessons[0]} unlocked={examUnlocked} onOpen={onStartExam}/>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginLeft: 74 }}>
                        {m.lessons.map(l => (
                          <LessonRow key={l.id} l={l} t={t} accent={accent} onOpen={() => l.state !== 'locked' && onLessonOpen?.(l.id, l.kind)}/>
                        ))}
                      </div>
                    )}
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

  function BossCard({ t, accent, l, unlocked, onOpen }) {
    return (
      <div style={{
        marginLeft: 74, padding: 22, borderRadius: 18,
        background: t.dark ? 'rgba(255,255,255,0.03)' : '#FFF',
        border: `1.5px dashed ${t.line}`,
        display: 'flex', alignItems: 'center', gap: 18,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Chip mono size="sm" bg={t.ink} color={t.bg}>EXAMEN FINAL</Chip>
          </div>
          <div style={{ marginTop: 8, fontSize: 18, fontWeight: 700, letterSpacing: -0.4, color: t.ink }}>{l?.title ?? 'Examen final del curso'}</div>
          <div style={{ marginTop: 4, fontSize: 13, color: t.muted, maxWidth: 480 }}>
            {unlocked
              ? 'Has completado todas las lecciones. Aprueba con 70% para obtener tu diploma.'
              : 'Completa todas las lecciones del curso para desbloquear el examen.'}
          </div>
        </div>
        {unlocked ? (
          <Button bg={accent.bg} fg={accent.fg} icon="play" onClick={onOpen}>Empezar examen</Button>
        ) : (
          <Button kind="ghost" iconRight="lock" disabled style={{ color: t.muted }}>Bloqueado</Button>
        )}
      </div>
    );
  }

  // ── HUB MOBILE ─────────────────────────────────────────────────────────────
  export function HubMobile({ tweak }: { tweak?: TweakOptions }) {
    const learn = useLearnDataOptional();
    const course = learn?.course ?? mockCourse;
    const modules = learn?.modules ?? mockModules;
    const onLessonOpen = learn?.onLessonOpen;
    const onGoHome = learn?.onGoHome;
    const onStartExam = learn?.onStartExam;
    const currentLesson = learn?.currentLesson;
    const examUnlocked = learn?.examUnlocked;
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
            <h1 style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: -1, lineHeight: 1.05 }}>
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
            onResume={() => resumeCurrent(currentLesson, onLessonOpen, onStartExam)}
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
            <h2 style={{ margin: '4px 0 18px', fontSize: 18, fontWeight: 700, letterSpacing: -0.4 }}>
              {modules.length} módulos · {lessonStats.total} lecciones
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {modules.map(m => {
                const completed = m.lessons.filter(l => l.state === 'done').length;
                const pct = m.lessons.length ? completed / m.lessons.length : 0;
                return (
                  <div key={m.n}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 14, display: 'grid', placeItems: 'center', background: pct === 1 ? accent.bg : 'transparent', color: pct === 1 ? accent.fg : t.ink, border: pct === 1 ? 'none' : `1.5px solid ${t.line}`, fontSize: 11, fontWeight: 700 }}>
                        {pct === 1 ? <Icon name="check" size={14} sw={3}/> : (m.isFinal ? <Icon name="trophy" size={14}/> : String(m.n).padStart(2,'0'))}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>{m.title}</div>
                      </div>
                      {!m.isFinal && <span style={{ fontSize: 11, color: t.muted, fontFamily: t.mono }}>{completed}/{m.lessons.length}</span>}
                    </div>
                    <div style={{ marginLeft: 38, display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {m.isFinal ? (
                        <BossCard t={t} accent={accent} l={m.lessons[0]} unlocked={examUnlocked} onOpen={onStartExam}/>
                      ) : m.lessons.map(l => (
                        <LessonRow key={l.id} l={l} t={t} accent={accent} compact onOpen={() => l.state !== 'locked' && onLessonOpen?.(l.id, l.kind)}/>
                      ))}
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
