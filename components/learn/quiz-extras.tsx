// @ts-nocheck — see README for typing guidance on internal helpers
'use client';
import React from 'react';
import { useTheme, Logo, Icon, Button, Progress, Chip, Mono, fmt } from './tokens';
import { mockCourse as course, mockModules as modules } from '@/lib/learn-mock';
import type { TweakOptions } from './types';

/* components/learn/quiz-extras.tsx — Tipos de pregunta adicionales
   - QuizImage:     pregunta visual (elegir entre 4 imágenes / SVG placeholders)
   - QuizTrueFalse: dos botones grandes V/F con feedback
   - QuizOrder:     drag & drop para ordenar pasos
*/

// Header común (igual que el del quiz normal)
  function QHeader({ t, accent, mobile, step, total, hearts }) {
    return (
      <div style={{
        padding: mobile ? '14px 16px' : '18px 28px',
        display: 'flex', alignItems: 'center', gap: 14,
        borderBottom: `1px solid ${t.line}`, background: t.surface, flexShrink: 0,
      }}>
        <button style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0 }}>
          <Icon name="x" size={20}/>
        </button>
        <div style={{ flex: 1, height: 10, background: t.lineSoft, borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ width: `${(step/total)*100}%`, height: '100%', background: accent.bg, borderRadius: 5 }}/>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#FF6B4A' }}>
          <Icon name="heartFill" size={18}/>
          <span style={{ fontWeight: 700, fontSize: 14, fontFamily: t.mono }}>{hearts}</span>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 01 — PREGUNTA VISUAL (elegir entre imágenes)
  // ────────────────────────────────────────────────────────────────────────────
  // Placeholders pictóricos: cuatro composiciones diferentes en SVG.
  function PhotoPlaceholder({ kind, accent, t }) {
    // Cada "kind" simula una composición distinta (tercios, central, líneas, patrón)
    const W = 320, H = 220;
    const base = (children) => (
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`g-${kind}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#2B3A50"/>
            <stop offset="1" stopColor="#0A0A14"/>
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#g-${kind})`}/>
        {children}
      </svg>
    );
    if (kind === 'thirds') return base(<>
      {/* Horizonte alto + figura en intersección */}
      <rect x="0" y="0" width={W} height="80" fill="#4A6580"/>
      <rect x="0" y="78" width={W} height="6" fill="#FF9B4A" opacity="0.6"/>
      <circle cx={W*0.66} cy="100" r="14" fill={accent.bg}/>
      <rect x={W*0.66 - 4} y="100" width="8" height="90" fill={accent.bg}/>
      {/* Grid líneas tercios */}
      <line x1={W/3} y1="0" x2={W/3} y2={H} stroke="#FFF" strokeOpacity="0.18" strokeDasharray="2 3"/>
      <line x1={2*W/3} y1="0" x2={2*W/3} y2={H} stroke="#FFF" strokeOpacity="0.18" strokeDasharray="2 3"/>
      <line x1="0" y1={H/3} x2={W} y2={H/3} stroke="#FFF" strokeOpacity="0.18" strokeDasharray="2 3"/>
      <line x1="0" y1={2*H/3} x2={W} y2={2*H/3} stroke="#FFF" strokeOpacity="0.18" strokeDasharray="2 3"/>
    </>);
    if (kind === 'center') return base(<>
      <circle cx={W/2} cy={H/2} r="40" fill={accent.bg}/>
      <rect x={W/2 - 5} y={H/2} width="10" height="70" fill={accent.bg}/>
    </>);
    if (kind === 'lines') return base(<>
      {/* Líneas convergentes */}
      <path d={`M 20 ${H} L ${W/2} ${H/2}`} stroke="#FFF" strokeWidth="2" strokeOpacity="0.4"/>
      <path d={`M ${W-20} ${H} L ${W/2} ${H/2}`} stroke="#FFF" strokeWidth="2" strokeOpacity="0.4"/>
      <path d={`M ${W/2 - 60} ${H} L ${W/2} ${H/2 + 30}`} stroke="#FFF" strokeWidth="1.5" strokeOpacity="0.3"/>
      <path d={`M ${W/2 + 60} ${H} L ${W/2} ${H/2 + 30}`} stroke="#FFF" strokeWidth="1.5" strokeOpacity="0.3"/>
      <circle cx={W/2} cy={H/2} r="6" fill={accent.bg}/>
    </>);
    if (kind === 'pattern') return base(<>
      {Array.from({ length: 30 }).map((_, i) => {
        const x = (i % 6) * (W/6) + 20;
        const y = Math.floor(i/6) * (H/5) + 20;
        return <rect key={i} x={x} y={y} width="32" height="32" rx="2" fill={i === 13 ? accent.bg : '#7A8FA8'} opacity={i === 13 ? 1 : 0.45}/>;
      })}
    </>);
    return base(null);
  }

  function QuizImageContent({ t, accent, mobile }) {
    const options = [
      { kind: 'thirds',  label: 'Foto A' },
      { kind: 'center',  label: 'Foto B' },
      { kind: 'lines',   label: 'Foto C' },
      { kind: 'pattern', label: 'Foto D' },
    ];
    const selected = 0; // correcto
    return (
      <main style={{ flex: 1, padding: mobile ? '20px 18px' : '36px 56px', overflowY: 'auto' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Mono color={t.faint}>PREGUNTA 04 / 06 · VISUAL</Mono>
          <h2 style={{ margin: '8px 0 4px', fontSize: mobile ? 22 : 28, fontWeight: 700, letterSpacing: -0.7, lineHeight: 1.15 }}>
            ¿Cuál de estas fotos usa la regla de los tercios?
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: t.muted }}>Pista: fíjate en dónde están los elementos importantes.</p>

          <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {options.map((o, i) => {
              const isSel = i === selected;
              return (
                <div key={o.kind} style={{
                  position: 'relative',
                  borderRadius: 14, overflow: 'hidden',
                  border: `2px solid ${isSel ? accent.bg : t.line}`,
                  cursor: 'pointer',
                  background: t.surface,
                  transition: 'transform .12s ease',
                  transform: isSel ? 'translateY(-2px)' : 'none',
                  boxShadow: isSel ? `0 12px 30px -16px ${accent.bg}80` : 'none',
                }}>
                  <PhotoPlaceholder kind={o.kind} accent={accent} t={t}/>
                  <div style={{ position: 'absolute', top: 8, left: 8, padding: '4px 8px', borderRadius: 8, background: 'rgba(10,10,20,0.65)', color: '#FFF', fontFamily: t.mono, fontSize: 10, letterSpacing: 1, fontWeight: 700 }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  {isSel && (
                    <div style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, background: accent.bg, color: accent.fg, display: 'grid', placeItems: 'center' }}>
                      <Icon name="check" size={14} sw={3}/>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Button bg={accent.bg} fg={accent.fg} size="lg" iconRight="arrowR" style={{ width: '100%', justifyContent: 'center', marginTop: 22 }}>
            Comprobar respuesta
          </Button>
        </div>
      </main>
    );
  }

  export function QuizImageDesktop({ tweak }: { tweak?: TweakOptions }) {
    const t = useTheme(tweak);
    return (
      <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: t.sans, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <QHeader t={t} accent={t.A} step={4} total={6} hearts={5}/>
        <QuizImageContent t={t} accent={t.A}/>
      </div>
    );
  };
  export function QuizImageMobile({ tweak }: { tweak?: TweakOptions }) {
    const t = useTheme(tweak);
    return (
      <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: t.sans, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <QHeader t={t} accent={t.A} mobile step={4} total={6} hearts={5}/>
        <QuizImageContent t={t} accent={t.A} mobile/>
      </div>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // 02 — VERDADERO / FALSO
  // ────────────────────────────────────────────────────────────────────────────
  function QuizTFContent({ t, accent, mobile }) {
    return (
      <main style={{ flex: 1, padding: mobile ? '24px 20px' : '40px 56px', overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', width: '100%', textAlign: 'center' }}>
          <Mono color={t.faint}>PREGUNTA 02 / 06 · VERDADERO O FALSO</Mono>

          {/* Cita visual */}
          <div style={{
            margin: `${mobile ? 18 : 28}px auto 0`, padding: mobile ? '24px 22px' : '32px 36px',
            borderRadius: 18, background: t.surface, border: `1px solid ${t.line}`,
            maxWidth: 620, position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: -14, left: 22, padding: '4px 10px', borderRadius: 6, background: accent.bg, color: accent.fg, fontFamily: t.mono, fontSize: 10, fontWeight: 700, letterSpacing: 1.4 }}>
              AFIRMACIÓN
            </div>
            <p style={{ margin: 0, fontFamily: t.serif, fontWeight: 400, fontStyle: 'italic', fontSize: mobile ? 22 : 30, letterSpacing: -0.6, lineHeight: 1.25, color: t.ink }}>
              «Una apertura f/1.8 deja entrar más luz que una f/8 — y por eso difumina más el fondo.»
            </p>
          </div>

          {/* Botones V/F */}
          <div style={{ marginTop: mobile ? 22 : 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
            <button style={{
              padding: mobile ? '22px 0' : '28px 0',
              borderRadius: 16,
              background: accent.bg + '22',
              border: `2px solid ${accent.bg}`,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              color: t.ink, transform: 'translateY(-2px)',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: accent.bg, color: accent.fg, display: 'grid', placeItems: 'center' }}>
                <Icon name="check" size={18} sw={3}/>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.4 }}>VERDADERO</div>
              <Mono color={accent.bg === '#C8F542' ? '#3F5A0A' : accent.bg} size={10}>TU ELECCIÓN</Mono>
            </button>
            <button style={{
              padding: mobile ? '22px 0' : '28px 0',
              borderRadius: 16,
              background: 'transparent',
              border: `1.5px solid ${t.line}`,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              color: t.muted,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, border: `1.5px solid ${t.line}`, display: 'grid', placeItems: 'center' }}>
                <Icon name="x" size={18}/>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.4 }}>FALSO</div>
              <Mono color={t.faint} size={10}>&nbsp;</Mono>
            </button>
          </div>

          <Button bg={t.ink} fg={t.bg} size="lg" iconRight="arrowR" style={{ marginTop: 22 }}>
            Confirmar
          </Button>
        </div>
      </main>
    );
  }

  export function QuizTFDesktop({ tweak }: { tweak?: TweakOptions }) {
    const t = useTheme(tweak);
    return (
      <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: t.sans, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <QHeader t={t} accent={t.A} step={2} total={6} hearts={5}/>
        <QuizTFContent t={t} accent={t.A}/>
      </div>
    );
  };
  export function QuizTFMobile({ tweak }: { tweak?: TweakOptions }) {
    const t = useTheme(tweak);
    return (
      <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: t.sans, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <QHeader t={t} accent={t.A} mobile step={2} total={6} hearts={5}/>
        <QuizTFContent t={t} accent={t.A} mobile/>
      </div>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // 03 — ORDENAR PASOS (drag & drop)
  // ────────────────────────────────────────────────────────────────────────────
  function QuizOrderContent({ t, accent, mobile }) {
    // Mostramos un estado intermedio: 2 colocados, 2 por arrastrar, 1 siendo arrastrado
    const placed = [
      { n: 1, text: 'Elige el sujeto principal y dónde colocarlo en el encuadre' },
      { n: 2, text: 'Ajusta la apertura para controlar la profundidad de campo' },
    ];
    const pool = [
      { text: 'Bloquea el enfoque sobre los ojos del sujeto', dragging: false },
      { text: 'Mide la exposición sobre la zona más importante', dragging: true },
    ];

    return (
      <main style={{ flex: 1, padding: mobile ? '20px 18px' : '36px 56px', overflowY: 'auto' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <Mono color={t.faint}>PREGUNTA 05 / 06 · ORDENAR</Mono>
          <h2 style={{ margin: '8px 0 6px', fontSize: mobile ? 22 : 28, fontWeight: 700, letterSpacing: -0.7, lineHeight: 1.15 }}>
            Ordena los pasos para hacer un retrato con poca luz.
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: t.muted }}>Arrastra las tarjetas al hueco correspondiente.</p>

          {/* Zona ordenada */}
          <div style={{ marginTop: 22, padding: 14, borderRadius: 16, background: t.dark ? 'rgba(255,255,255,0.03)' : t.surface2, border: `1px dashed ${t.line}` }}>
            <Mono color={t.faint} size={10} style={{ marginBottom: 10, display: 'block' }}>TU ORDEN</Mono>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0,1,2,3].map(idx => {
                const item = placed[idx];
                if (item) {
                  return (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 12,
                      background: t.surface, border: `1.5px solid ${t.line}`,
                      cursor: 'grab',
                    }}>
                      <div style={{ width: 26, height: 26, borderRadius: 13, background: accent.bg, color: accent.fg, display: 'grid', placeItems: 'center', flexShrink: 0, fontFamily: t.mono, fontSize: 12, fontWeight: 700 }}>
                        {idx + 1}
                      </div>
                      <span style={{ flex: 1, fontSize: 14, color: t.ink, fontWeight: 500 }}>{item.text}</span>
                      <Icon name="menu" size={16} sw={2}/>
                    </div>
                  );
                } else {
                  // Slot vacío
                  return (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 12,
                      background: 'transparent', border: `1.5px dashed ${t.line}`,
                      color: t.faint, minHeight: 50,
                    }}>
                      <div style={{ width: 26, height: 26, borderRadius: 13, border: `1.5px dashed ${t.line}`, display: 'grid', placeItems: 'center', flexShrink: 0, fontFamily: t.mono, fontSize: 12, fontWeight: 700 }}>
                        {idx + 1}
                      </div>
                      <span style={{ flex: 1, fontSize: 13, color: t.faint, fontStyle: 'italic' }}>arrastra aquí…</span>
                    </div>
                  );
                }
              })}
            </div>
          </div>

          {/* Pool */}
          <Mono color={t.faint} size={10} style={{ marginTop: 22, display: 'block' }}>POR COLOCAR</Mono>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pool.map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12,
                background: p.dragging ? t.ink : t.surface,
                color: p.dragging ? t.bg : t.ink,
                border: p.dragging ? `1.5px solid ${accent.bg}` : `1.5px solid ${t.line}`,
                cursor: 'grab',
                transform: p.dragging ? 'rotate(-1deg) scale(1.02)' : 'none',
                boxShadow: p.dragging ? `0 20px 40px -20px rgba(10,10,20,0.4)` : 'none',
              }}>
                <Icon name="menu" size={16} sw={2}/>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{p.text}</span>
                {p.dragging && <Chip size="sm" bg={accent.bg} color={accent.fg} mono>SOLTAR</Chip>}
              </div>
            ))}
          </div>

          <Button bg={accent.bg} fg={accent.fg} size="lg" iconRight="arrowR" disabled={pool.length > 0} style={{ width: '100%', justifyContent: 'center', marginTop: 22 }}>
            {pool.length > 0 ? `Te quedan ${pool.length} por colocar` : 'Comprobar orden'}
          </Button>
        </div>
      </main>
    );
  }

  export function QuizOrderDesktop({ tweak }: { tweak?: TweakOptions }) {
    const t = useTheme(tweak);
    return (
      <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: t.sans, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <QHeader t={t} accent={t.A} step={5} total={6} hearts={4}/>
        <QuizOrderContent t={t} accent={t.A}/>
      </div>
    );
  };
  export function QuizOrderMobile({ tweak }: { tweak?: TweakOptions }) {
    const t = useTheme(tweak);
    return (
      <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: t.sans, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <QHeader t={t} accent={t.A} mobile step={5} total={6} hearts={4}/>
        <QuizOrderContent t={t} accent={t.A} mobile/>
      </div>
    );
  };
