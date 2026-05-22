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

  // ── HUB DESKTOP ────────────────────────────────────────────────────────────
  export function HubDesktop({ tweak }: { tweak?: TweakOptions }) {
    const learn = useLearnDataOptional();
    const course = learn?.course ?? mockCourse;
    const modules = learn?.modules ?? mockModules;
    const onLessonOpen = learn?.onLessonOpen;
    const t = useTheme(tweak);
    const { A: accent } = t;

    return (
      <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: t.sans, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar nav */}
        <aside style={{ width: 240, background: t.surface, borderRight: `1px solid ${t.line}`, padding: '22px 18px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <Logo size={26} color={t.ink}/>
          <nav style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { ic: 'grid', label: 'Mis cursos', active: false },
              { ic: 'play', label: 'Continuar', active: true, badge: '2' },
              { ic: 'bookmark', label: 'Guardado' },
              { ic: 'trophy', label: 'Logros' },
              { ic: 'doc', label: 'Diplomas' },
            ].map((it, i) => (
              <a key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10,
                background: it.active ? (t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(10,10,20,0.04)') : 'transparent',
                color: it.active ? t.ink : t.muted,
                fontSize: 14, fontWeight: it.active ? 600 : 500,
                cursor: 'pointer',
              }}>
                <Icon name={it.ic} size={17}/>
                <span style={{ flex: 1 }}>{it.label}</span>
                {it.badge && <Chip size="sm" bg={accent.bg} color={accent.fg}>{it.badge}</Chip>}
              </a>
            ))}
          </nav>

          <div style={{ marginTop: 'auto', padding: 14, borderRadius: 14, background: t.dark ? 'rgba(255,255,255,0.04)' : t.surface2, border: `1px solid ${t.line}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="fire" size={18}/>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Racha de {course.streak} días</span>
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
              {['L','M','X','J','V','S','D'].map((d, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ height: 22, borderRadius: 6, background: i < 5 ? accent.bg : 'transparent', border: i < 5 ? 'none' : `1.5px dashed ${t.line}`, marginBottom: 4 }}/>
                  <Mono color={i < 5 ? t.ink : t.faint} size={9}>{d}</Mono>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          {/* Hero del curso */}
          <section style={{ padding: '32px 48px 36px', borderBottom: `1px solid ${t.line}`, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <Chip mono size="sm" color={t.muted} border={`1px solid ${t.line}`}>FOTOGRAFÍA</Chip>
                  <Chip mono size="sm" color={t.muted} border={`1px solid ${t.line}`}>{course.level.toUpperCase()}</Chip>
                  <Mono color={t.faint}>· 14 lecciones · {course.duration}</Mono>
                </div>
                <h1 style={{ margin: 0, fontFamily: t.sans, fontSize: 44, fontWeight: 800, color: t.ink, letterSpacing: -1.6, lineHeight: 1.02, maxWidth: 640 }}>
                  Captura el mundo<br/>a través de tu lente.
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 18, background: `linear-gradient(135deg, ${accent.bg}, #1b38c4)`, flexShrink: 0 }}/>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: t.ink }}>{course.instructor}</div>
                    <div style={{ fontSize: 12, color: t.muted }}>{course.instructorRole}</div>
                  </div>
                </div>
              </div>

              {/* Continue card */}
              <div style={{
                width: 320, padding: 22, borderRadius: 18,
                background: t.ink, color: t.bg, flexShrink: 0,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, background: `radial-gradient(circle, ${accent.bg}66, transparent 70%)` }}/>
                <Mono color={accent.bg} size={10}>CONTINÚA DONDE LO DEJASTE</Mono>
                <div style={{ marginTop: 10, fontSize: 20, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.2 }}>
                  Líneas, formas y patrones
                </div>
                <div style={{ marginTop: 6, fontSize: 13, opacity: 0.7 }}>
                  Lección 2.2 · 12 min restantes
                </div>
                <div style={{ marginTop: 16 }}>
                  <Progress value={0.35} color={accent.bg} track="rgba(255,255,255,0.15)" height={5}/>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <Mono color="rgba(255,255,255,0.5)" size={10}>35%</Mono>
                    <Mono color="rgba(255,255,255,0.5)" size={10}>04:18 / 12:32</Mono>
                  </div>
                </div>
                <div style={{ position: 'relative', zIndex: 1, marginTop: 18 }}>
                  <Button bg={accent.bg} fg={accent.fg} icon="play" size="md" style={{ width: '100%', justifyContent: 'center' }}>
                    Reanudar lección
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 32, marginTop: 32, paddingTop: 22, borderTop: `1px solid ${t.line}` }}>
              <Stat t={t} label="Progreso del curso" value={`${Math.round(course.completion * 100)}%`} sub={
                <Progress value={course.completion} color={accent.bg} height={4} style={{ marginTop: 8, maxWidth: 180 }}/>
              }/>
              <Stat t={t} label="XP acumulada" value={fmt.n(course.xp)} sub={<span style={{ fontSize: 12, color: t.muted }}>+120 esta semana</span>}/>
              <Stat t={t} label="Racha actual" value={`${course.streak} días`} sub={<span style={{ fontSize: 12, color: t.muted }}>Mejor: 11 días</span>}/>
              <Stat t={t} label="Promedio quizzes" value="92%" sub={<span style={{ fontSize: 12, color: t.muted }}>3 quizzes superados</span>}/>
            </div>
          </section>

          {/* Módulos */}
          <section style={{ padding: '36px 48px 60px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
              <div>
                <Mono color={t.faint}>04 MÓDULOS · 14 LECCIONES</Mono>
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
                      <BossCard t={t} accent={accent} l={m.lessons[0]}/>
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
        </main>

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

  function BossCard({ t, accent, l }) {
    return (
      <div style={{
        marginLeft: 74, padding: 22, borderRadius: 18,
        background: t.dark ? 'rgba(255,255,255,0.03)' : '#FFF',
        border: `1.5px dashed ${t.line}`,
        display: 'flex', alignItems: 'center', gap: 18,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Chip mono size="sm" bg={t.ink} color={t.bg}>BOSS FIGHT</Chip>
            <Mono color={t.faint}>20 PREGUNTAS · 12 MIN · 1 INTENTO</Mono>
          </div>
          <div style={{ marginTop: 8, fontSize: 18, fontWeight: 700, letterSpacing: -0.4, color: t.ink }}>{l.title}</div>
          <div style={{ marginTop: 4, fontSize: 13, color: t.muted, maxWidth: 480 }}>
            Demuestra lo que dominas. Apruebas con 70% y desbloqueas tu diploma firmado por Lucía.
          </div>
        </div>
        <Button kind="ghost" iconRight="lock" disabled style={{ color: t.muted }}>Bloqueado</Button>
      </div>
    );
  }

  // ── HUB MOBILE ─────────────────────────────────────────────────────────────
  export function HubMobile({ tweak }: { tweak?: TweakOptions }) {
    const learn = useLearnDataOptional();
    const course = learn?.course ?? mockCourse;
    const modules = learn?.modules ?? mockModules;
    const onLessonOpen = learn?.onLessonOpen;
    const t = useTheme(tweak);
    const { A: accent } = t;

    return (
      <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: t.sans, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ padding: '14px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <Logo size={22} color={t.ink} withText={false}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Chip size="sm" bg={accent.bg} color={accent.fg} icon="fire">{course.streak}</Chip>
            <Chip size="sm" border={`1px solid ${t.line}`} color={t.ink} icon="bolt">{fmt.n(course.xp)}</Chip>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 100px' }}>
          {/* Header curso */}
          <div>
            <Mono color={t.faint}>FOTOGRAFÍA · PRINCIPIANTE</Mono>
            <h1 style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: -1, lineHeight: 1.05 }}>
              Captura el mundo a través de tu lente.
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: `linear-gradient(135deg, ${accent.bg}, #1b38c4)` }}/>
              <div style={{ fontSize: 13, color: t.muted }}>
                <span style={{ color: t.ink, fontWeight: 600 }}>{course.instructor}</span> · {course.duration}
              </div>
            </div>
          </div>

          {/* Continue card */}
          <div style={{
            marginTop: 22, padding: 18, borderRadius: 18, background: t.ink, color: t.bg,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, background: `radial-gradient(circle, ${accent.bg}55, transparent 70%)` }}/>
            <Mono color={accent.bg} size={9}>CONTINÚA AHORA</Mono>
            <div style={{ marginTop: 8, fontSize: 18, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.15 }}>
              Líneas, formas y patrones
            </div>
            <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>Lección 2.2 · 12 min restantes</div>
            <div style={{ marginTop: 14 }}>
              <Progress value={0.35} color={accent.bg} track="rgba(255,255,255,0.15)" height={4}/>
            </div>
            <Button bg={accent.bg} fg={accent.fg} icon="play" size="sm" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}>
              Reanudar
            </Button>
          </div>

          {/* Progreso */}
          <div style={{ marginTop: 22, padding: '14px 16px', borderRadius: 14, background: t.surface, border: `1px solid ${t.line}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Mono color={t.faint}>TU PROGRESO</Mono>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{Math.round(course.completion*100)}%</span>
            </div>
            <Progress value={course.completion} color={accent.bg} height={5} style={{ marginTop: 8 }}/>
            <div style={{ marginTop: 8, fontSize: 12, color: t.muted }}>6 de 14 lecciones · Tardarás ~2h 40min</div>
          </div>

          {/* Módulos */}
          <div style={{ marginTop: 28 }}>
            <Mono color={t.faint}>TU CAMINO</Mono>
            <h2 style={{ margin: '4px 0 18px', fontSize: 18, fontWeight: 700, letterSpacing: -0.4 }}>4 módulos · 14 lecciones</h2>

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
                      {m.lessons.map(l => (<LessonRow key={l.id} l={l} t={t} accent={accent} compact onOpen={() => l.state !== 'locked' && onLessonOpen?.(l.id, l.kind)}/>))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom nav */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px 24px 22px', background: t.surface, borderTop: `1px solid ${t.line}`, display: 'flex', justifyContent: 'space-around' }}>
          {[
            { ic: 'grid', label: 'Cursos' },
            { ic: 'play', label: 'Aprender', active: true },
            { ic: 'trophy', label: 'Logros' },
            { ic: 'doc', label: 'Diplomas' },
          ].map((it, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: it.active ? t.ink : t.faint }}>
              <Icon name={it.ic} size={20}/>
              <span style={{ fontSize: 10, fontWeight: it.active ? 700 : 500 }}>{it.label}</span>
            </div>
          ))}
        </div>

        <style>{`@keyframes rx-pulse { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.4); opacity: .55 } }`}</style>
      </div>
    );
  };
