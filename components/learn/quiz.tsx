// @ts-nocheck — see README for typing guidance on internal helpers
'use client';
import React from 'react';
import { useTheme, Logo, Icon, Button, Progress, Chip, Mono, fmt } from './tokens';
import { mockCourse as course, mockModules as modules } from '@/lib/learn-mock';
import type { TweakOptions } from './types';

/* components/learn/quiz.tsx — Quizzes
   - QuizLessonDesktop / Mobile  → quiz por lección (cards Duolingo style)
   - QuizBossDesktop / Mobile    → examen final con timer, racha, HP
   - QuizResultsDesktop / Mobile → pantalla de resultados con celebración */

// Confetti SVG decorativo
  function Confetti({ accent, density = 1 }) {
    const N = Math.round(40 * density);
    const out = [];
    for (let i = 0; i < N; i++) {
      const x = (i * 137) % 1000 / 10;
      const y = (i * 91) % 1000 / 10;
      const r = 4 + (i % 5);
      const c = [accent.bg, '#1b38c4', '#FF6B4A', '#0A0A14'][i % 4];
      const rot = (i * 47) % 90;
      out.push(
        <rect key={i} x={x + '%'} y={y + '%'} width={r} height={r * 2.5} fill={c} transform={`rotate(${rot} ${x} ${y})`} opacity={0.85}/>
      );
    }
    return (
      <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} preserveAspectRatio="none" width="100%" height="100%">
        {out}
      </svg>
    );
  }

  // ── QUIZ LESSON — UNA PREGUNTA TIPO TARJETA ────────────────────────────────
  function QuizCard({ t, accent, mobile, step, total, q, selected, status }) {
    // status: 'idle' | 'correct' | 'wrong'
    return (
      <div style={{
        width: '100%', maxWidth: mobile ? '100%' : 540,
        background: t.surface, borderRadius: 24,
        border: `1px solid ${t.line}`,
        padding: mobile ? '24px 22px 28px' : '32px 36px 36px',
        boxShadow: mobile ? 'none' : '0 30px 60px -40px rgba(10,10,20,0.25)',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <Mono color={t.faint}>PREGUNTA {String(step).padStart(2,'0')} / {String(total).padStart(2,'0')}</Mono>
          <Chip size="sm" bg={accent.bg} color={accent.fg} icon="bolt">+10 XP</Chip>
        </div>
        <h2 style={{ margin: 0, fontFamily: t.sans, fontSize: mobile ? 22 : 26, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.2, color: t.ink }}>
          {q.text}
        </h2>
        {q.hint && (
          <p style={{ margin: '10px 0 0', fontSize: 13.5, color: t.muted, lineHeight: 1.5 }}>{q.hint}</p>
        )}

        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = q.correct === i;
            let bg = 'transparent', bd = t.line, fg = t.ink, dotBg = 'transparent', dotBd = t.line;
            if (status === 'idle' && isSelected) {
              bg = t.dark ? 'rgba(255,255,255,0.04)' : t.surface2; bd = t.ink; dotBg = t.ink; dotBd = t.ink;
            }
            if (status === 'correct' && isSelected) {
              bg = accent.bg + '22'; bd = accent.bg; dotBg = accent.bg; dotBd = accent.bg;
            }
            if (status === 'wrong') {
              if (isSelected)   { bg = '#FF6B4A22'; bd = '#FF6B4A'; dotBg = '#FF6B4A'; dotBd = '#FF6B4A'; }
              if (isCorrect && !isSelected) { bg = accent.bg + '22'; bd = accent.bg; dotBg = accent.bg; dotBd = accent.bg; }
            }
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: mobile ? '14px 16px' : '16px 18px',
                borderRadius: 14, border: `1.5px solid ${bd}`, background: bg,
                cursor: 'pointer', transition: 'background .12s ease',
                color: fg,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  display: 'grid', placeItems: 'center',
                  border: `1.5px solid ${dotBd}`, background: dotBg,
                  color: dotBg === t.ink ? t.bg : (dotBg === accent.bg ? accent.fg : (dotBg === '#FF6B4A' ? '#FFF' : t.faint)),
                  fontFamily: t.mono, fontSize: 12, fontWeight: 700,
                }}>
                  {(status === 'correct' && isSelected) || (status === 'wrong' && isCorrect) ? <Icon name="check" size={14} sw={3}/>
                    : (status === 'wrong' && isSelected) ? <Icon name="x" size={14} sw={3}/>
                    : String.fromCharCode(65 + i)}
                </div>
                <span style={{ flex: 1, fontSize: mobile ? 15 : 16, fontWeight: 500, color: t.ink }}>{opt}</span>
              </div>
            );
          })}
        </div>

        {status === 'idle' && (
          <Button bg={accent.bg} fg={accent.fg} size="lg" iconRight="arrowR" style={{ width: '100%', justifyContent: 'center', marginTop: 22 }}>
            Comprobar respuesta
          </Button>
        )}
      </div>
    );
  }

  // Feedback banner (cuando hay respuesta)
  function FeedbackBanner({ t, accent, mobile, status, explanation }) {
    if (status === 'idle') return null;
    const ok = status === 'correct';
    return (
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: ok ? (t.dark ? accent.bg : accent.bg) : '#FF6B4A',
        color: ok ? accent.fg : '#FFFFFF',
        padding: mobile ? '20px 22px 26px' : '28px 36px',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        boxShadow: '0 -10px 30px rgba(10,10,20,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ width: 44, height: 44, borderRadius: 22, background: ok ? 'rgba(10,10,20,0.1)' : 'rgba(255,255,255,0.18)', display: 'grid', placeItems: 'center' }}>
            <Icon name={ok ? 'check' : 'x'} size={22} sw={3}/>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: mobile ? 20 : 24, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1 }}>
              {ok ? '¡Bien hecho, Hugo!' : '¡Casi! Mira esto:'}
            </div>
            <div style={{ marginTop: 4, fontSize: 13.5, opacity: 0.85, maxWidth: 460, lineHeight: 1.45 }}>
              {explanation}
            </div>
          </div>
          <Button bg={ok ? '#0A0A14' : '#FFFFFF'} fg={ok ? '#FFFFFF' : '#0A0A14'} iconRight="arrowR" size={mobile ? 'md' : 'lg'}>
            Siguiente
          </Button>
        </div>
      </div>
    );
  }

  // ── HEADER QUIZ ────────────────────────────────────────────────────────────
  function QuizHeader({ t, accent, mobile, step, total, hearts, streak, onClose }) {
    return (
      <div style={{
        padding: mobile ? '14px 16px' : '18px 28px',
        display: 'flex', alignItems: 'center', gap: 14,
        borderBottom: `1px solid ${t.line}`, background: t.surface, flexShrink: 0,
      }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0 }}>
          <Icon name="x" size={20}/>
        </button>
        <div style={{ flex: 1, height: 10, background: t.lineSoft, borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
          <div style={{ width: `${(step/total)*100}%`, height: '100%', background: accent.bg, borderRadius: 5, transition: 'width .4s' }}/>
        </div>
        {hearts != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#FF6B4A' }}>
            <Icon name="heartFill" size={18}/>
            <span style={{ fontWeight: 700, fontSize: 14, fontFamily: t.mono }}>{hearts}</span>
          </div>
        )}
        {streak != null && (
          <Chip size="sm" bg={t.ink} color={t.bg} icon="flame">{streak}</Chip>
        )}
      </div>
    );
  }

  // ── QUIZ LESSON ────────────────────────────────────────────────────────────
  const sampleQ = {
    text: '¿Qué controla la cantidad de luz que entra al sensor en un instante?',
    hint: 'Pista: piensa en cuánto tiempo dejas la puerta abierta.',
    options: [
      'La velocidad de obturación',
      'La distancia focal',
      'La sensibilidad ISO',
      'El balance de blancos',
    ],
    correct: 0,
  };

  export function QuizLessonDesktop({ tweak }: { tweak?: TweakOptions }) {
    const t = useTheme(tweak);
    const { A: accent } = t;
    return (
      <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: t.sans, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <QuizHeader t={t} accent={accent} step={3} total={6} hearts={3} streak={2}/>
        <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '40px 24px 140px', overflowY: 'auto' }}>
          <QuizCard t={t} accent={accent} step={3} total={6} q={sampleQ} selected={0} status="correct"/>
        </main>
        <FeedbackBanner t={t} accent={accent} status="correct" explanation="Exacto. La velocidad de obturación es el tiempo que el sensor permanece expuesto. Más tiempo, más luz — pero también más movimiento."/>
      </div>
    );
  };

  export function QuizLessonMobile({ tweak }: { tweak?: TweakOptions }) {
    const t = useTheme(tweak);
    const { A: accent } = t;
    // Wrong answer state in mobile so user sees both states
    const q2 = sampleQ;
    return (
      <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: t.sans, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <QuizHeader t={t} accent={accent} mobile step={3} total={6} hearts={2} streak={0}/>
        <main style={{ flex: 1, padding: '22px 18px 200px', overflowY: 'auto' }}>
          <QuizCard t={t} accent={accent} mobile step={3} total={6} q={q2} selected={2} status="wrong"/>
        </main>
        <FeedbackBanner t={t} accent={accent} mobile status="wrong" explanation="ISO controla la sensibilidad a la luz, no cuánta entra. La respuesta es la velocidad de obturación."/>
      </div>
    );
  };

  // ── QUIZ BOSS FIGHT ────────────────────────────────────────────────────────
  // Pantalla más cinematográfica: timer, racha visible, HP del estudiante,
  // pregunta presentada como duelo.

  function BossArena({ t, accent, mobile, step, total, time, combo }) {
    return (
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: t.ink, color: t.bg,
        padding: mobile ? '20px 18px' : '40px 56px',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* fondo */}
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 80% 0%, ${accent.bg}33, transparent 50%), radial-gradient(circle at 0% 100%, #1b38c455, transparent 50%)`, pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: `linear-gradient(${t.bg} 1px, transparent 1px), linear-gradient(90deg, ${t.bg} 1px, transparent 1px)`, backgroundSize: '24px 24px', pointerEvents: 'none' }}/>

        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, position: 'relative', zIndex: 1, flexWrap: mobile ? 'wrap' : 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Chip size="sm" bg={accent.bg} color={accent.fg} mono>BOSS FIGHT</Chip>
            <Mono color="rgba(244,244,240,0.5)">PREGUNTA {String(step).padStart(2,'0')} / {String(total).padStart(2,'0')}</Mono>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: mobile ? 10 : 20 }}>
            {/* Combo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: combo >= 3 ? accent.bg : 'rgba(244,244,240,0.6)' }}>
              <Icon name="flame" size={18}/>
              <span style={{ fontFamily: t.mono, fontWeight: 700, fontSize: 16 }}>×{combo}</span>
            </div>
            {/* Timer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'rgba(244,244,240,0.08)', border: `1px solid rgba(244,244,240,0.12)` }}>
              <Icon name="clock" size={14}/>
              <span style={{ fontFamily: t.mono, fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>{time}</span>
            </div>
          </div>
        </div>

        {/* HP bar */}
        <div style={{ marginTop: mobile ? 18 : 22, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Mono color="rgba(244,244,240,0.5)" size={10}>TUS VIDAS · 5 PERMITIDAS</Mono>
            <Mono color="rgba(244,244,240,0.5)" size={10}>SCORE 1240 XP</Mono>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i <= 4 ? accent.bg : 'rgba(244,244,240,0.15)' }}/>
            ))}
          </div>
        </div>

        {/* Pregunta */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1, marginTop: mobile ? 28 : 0, marginBottom: mobile ? 16 : 0 }}>
          <Mono color={accent.bg} size={11}>COMPOSICIÓN · DIFICULTAD 03/05</Mono>
          <h1 style={{ margin: '14px 0 0', fontFamily: t.sans, fontWeight: 700, fontSize: mobile ? 30 : 52, letterSpacing: -1.4, lineHeight: 1.04, color: t.bg, maxWidth: 820 }}>
            ¿Qué hace que un patrón sea memorable en una fotografía?
          </h1>
          <p style={{ marginTop: 14, fontSize: mobile ? 14 : 16, color: 'rgba(244,244,240,0.65)', lineHeight: 1.5, maxWidth: 600 }}>
            Pista de Lucía: piensa en la última foto tuya que de verdad le sorprendió a alguien.
          </p>
        </div>

        {/* Opciones */}
        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 12, marginTop: mobile ? 16 : 24 }}>
          {[
            { k: 'A', label: 'Que sea perfectamente simétrico y sin elementos extraños', hot: false },
            { k: 'B', label: 'Que se repita en al menos cinco elementos visibles',          hot: false },
            { k: 'C', label: 'Que el patrón se rompa con un elemento inesperado',           hot: true },
            { k: 'D', label: 'Que tenga colores complementarios entre sí',                  hot: false },
          ].map(o => (
            <div key={o.k} style={{
              padding: '16px 18px', borderRadius: 14,
              background: o.hot ? 'rgba(244,244,240,0.10)' : 'rgba(244,244,240,0.04)',
              border: `1.5px solid ${o.hot ? 'rgba(244,244,240,0.4)' : 'rgba(244,244,240,0.12)'}`,
              display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: o.hot ? accent.bg : 'rgba(244,244,240,0.10)', color: o.hot ? accent.fg : t.bg, display: 'grid', placeItems: 'center', fontFamily: t.mono, fontSize: 13, fontWeight: 700 }}>
                {o.k}
              </div>
              <span style={{ flex: 1, fontSize: mobile ? 14 : 16, fontWeight: 500, lineHeight: 1.35 }}>{o.label}</span>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div style={{ marginTop: mobile ? 16 : 24, position: 'relative', zIndex: 1, display: 'flex', justifyContent: mobile ? 'stretch' : 'flex-end' }}>
          <Button bg={accent.bg} fg={accent.fg} size="lg" iconRight="arrowR" style={mobile ? { width: '100%', justifyContent: 'center' } : {}}>
            Confirmar respuesta
          </Button>
        </div>
      </div>
    );
  }

  export function QuizBossDesktop({ tweak }: { tweak?: TweakOptions }) {
    const t = useTheme(tweak);
    const { A: accent } = t;
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', fontFamily: t.sans, overflow: 'hidden' }}>
        <BossArena t={t} accent={accent} step={11} total={20} time="07:42" combo={4}/>
      </div>
    );
  };

  export function QuizBossMobile({ tweak }: { tweak?: TweakOptions }) {
    const t = useTheme(tweak);
    const { A: accent } = t;
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', fontFamily: t.sans, overflow: 'hidden' }}>
        <BossArena t={t} accent={accent} mobile step={11} total={20} time="07:42" combo={4}/>
      </div>
    );
  };

  // ── RESULTADOS DEL QUIZ ────────────────────────────────────────────────────
  function ResultsContent({ t, accent, mobile }) {
    const score = 18, total = 20, pct = score / total;
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', background: t.bg, color: t.ink, overflow: 'hidden' }}>
        {/* Confetti decorativo */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.55 }}>
          <Confetti accent={accent}/>
        </div>

        <div style={{ position: 'relative', height: '100%', overflowY: 'auto', padding: mobile ? '30px 22px' : '48px 56px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
            <Mono color={t.faint}>EXAMEN FINAL · COMPLETADO</Mono>

            {/* Big numbers */}
            <div style={{ marginTop: 16, position: 'relative', display: 'inline-block' }}>
              <div style={{ fontFamily: t.sans, fontWeight: 700, fontSize: mobile ? 96 : 168, lineHeight: 0.9, letterSpacing: -6, color: t.ink }}>
                {score}<span style={{ color: t.faint }}>/{total}</span>
              </div>
              <div style={{ position: 'absolute', top: -10, right: mobile ? -10 : -30, transform: 'rotate(12deg)' }}>
                <Chip bg={accent.bg} color={accent.fg} mono>★ NOTABLE</Chip>
              </div>
            </div>

            <h1 style={{ margin: mobile ? '16px 0 0' : '20px 0 0', fontFamily: t.sans, fontSize: mobile ? 28 : 44, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.05 }}>
              ¡Lo conseguiste, Hugo!
            </h1>
            <p style={{ margin: '12px 0 0', fontSize: mobile ? 15 : 17, color: t.muted, lineHeight: 1.55, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
              Has aprobado <em>Captura el mundo a través de tu lente</em> con un 90%. Tu diploma firmado por Lucía ya está listo.
            </p>

            {/* Stat strip */}
            <div style={{ marginTop: mobile ? 28 : 36, display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10, textAlign: 'left' }}>
              {[
                { label: 'PRECISIÓN',   value: '90%',      sub: '+18 aciertos' },
                { label: 'COMBO MÁX',    value: '×7',       sub: 'preguntas seguidas' },
                { label: 'TIEMPO',       value: '08:24',    sub: 'de 12:00' },
                { label: 'XP GANADA',    value: '+340',     sub: 'nuevo total: 1580' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '14px 16px', borderRadius: 14, background: t.surface, border: `1px solid ${t.line}` }}>
                  <Mono color={t.faint} size={9}>{s.label}</Mono>
                  <div style={{ marginTop: 4, fontSize: mobile ? 22 : 28, fontWeight: 700, letterSpacing: -0.5, color: t.ink, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ marginTop: 2, fontSize: 11, color: t.muted }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Logros desbloqueados */}
            <div style={{ marginTop: mobile ? 28 : 40, padding: '20px 22px', borderRadius: 18, background: t.surface, border: `1px solid ${t.line}`, textAlign: 'left' }}>
              <Mono color={t.faint}>3 LOGROS DESBLOQUEADOS</Mono>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: mobile ? 'column' : 'row', gap: 12 }}>
                {[
                  { ic: 'trophy', name: 'Mirada entrenada',  sub: 'Completaste tu primer curso' },
                  { ic: 'flame',  name: 'Combo de 7',         sub: '7 aciertos seguidos en el boss' },
                  { ic: 'star',   name: 'Por encima del 85%', sub: 'Notable en el examen final' },
                ].map((b, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 24, background: accent.bg, color: accent.fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon name={b.ic} size={22}/>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: t.ink, lineHeight: 1.1 }}>{b.name}</div>
                      <div style={{ marginTop: 2, fontSize: 11, color: t.muted, lineHeight: 1.3 }}>{b.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones */}
            <div style={{ marginTop: mobile ? 24 : 32, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button bg={t.ink} fg={t.bg} icon="trophy" size="lg">Ver mi diploma</Button>
              <Button kind="ghost" icon="share" size="lg" style={{ borderColor: t.line, color: t.ink }}>Compartir resultado</Button>
            </div>

            {/* Próximos pasos */}
            <div style={{ marginTop: mobile ? 28 : 40, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14, background: t.dark ? 'rgba(255,255,255,0.04)' : t.surface2, border: `1px solid ${t.line}` }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${accent.bg}, #1b38c4)`, flexShrink: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Mono color={t.faint} size={10}>SIGUIENTE EN TU CAMINO</Mono>
                <div style={{ marginTop: 4, fontSize: 15, fontWeight: 700, color: t.ink }}>Retrato natural — el rostro como paisaje</div>
                <div style={{ marginTop: 2, fontSize: 12, color: t.muted }}>Lucía Vega · 6 lecciones · Intermedio</div>
              </div>
              <Icon name="arrowR" size={18}/>
            </div>
          </div>
        </div>
      </div>
    );
  }

  export function QuizResultsDesktop({ tweak }: { tweak?: TweakOptions }) {
    const t = useTheme(tweak);
    return <ResultsContent t={t} accent={t.A}/>;
  };
  export function QuizResultsMobile({ tweak }: { tweak?: TweakOptions }) {
    const t = useTheme(tweak);
    return <ResultsContent t={t} accent={t.A} mobile/>;
  };
