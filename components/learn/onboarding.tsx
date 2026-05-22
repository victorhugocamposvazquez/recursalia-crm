// @ts-nocheck — see README for typing guidance on internal helpers
'use client';
import React from 'react';
import { useTheme, Logo, Icon, Button, Progress, Chip, Mono, fmt } from './tokens';
import { mockCourse as course, mockModules as modules } from '@/lib/learn-mock';
import type { TweakOptions } from './types';

/* components/learn/onboarding.tsx — Onboarding del primer quiz
   Secuencia de 3 pantallas que explican las mecánicas justo antes
   de entrar al primer quiz. Estilo: pantalla limpia, una idea por slide,
   ilustración SVG geométrica + microcopy cercano. */

// Ilustración 01 — Vidas (5 corazones, uno parpadea)
  function IllustrationHearts({ t, accent, size }) {
    const s = size;
    return (
      <svg width={s} height={s * 0.6} viewBox="0 0 300 180">
        {/* "ground line" */}
        <line x1="20" y1="160" x2="280" y2="160" stroke={t.line} strokeWidth="1" strokeDasharray="2 4"/>
        {/* hearts */}
        {[0, 1, 2, 3, 4].map(i => {
          const x = 40 + i * 55;
          const lost = i === 3;
          return (
            <g key={i} transform={`translate(${x} ${lost ? 110 : 70})`}>
              <path d="M 0 14 C 0 4, -16 -2, -16 8 C -16 22, 0 34, 0 34 C 0 34, 16 22, 16 8 C 16 -2, 0 4, 0 14 Z"
                fill={lost ? 'none' : accent.bg}
                stroke={lost ? t.faint : 'none'}
                strokeWidth={lost ? 1.5 : 0}
                strokeDasharray={lost ? '3 3' : 'none'}
                transform={`scale(${lost ? 0.6 : 0.9})`}
              />
            </g>
          );
        })}
        {/* lost label */}
        <g transform="translate(207 145)">
          <text fontFamily="'JetBrains Mono', monospace" fontSize="9" letterSpacing="1.3" textAnchor="middle" fill={t.faint}>FALLO −1</text>
        </g>
      </svg>
    );
  }

  // Ilustración 02 — Combo (números crecientes)
  function IllustrationCombo({ t, accent, size }) {
    const s = size;
    return (
      <svg width={s} height={s * 0.6} viewBox="0 0 300 180">
        {[1, 2, 3, 4, 5].map(i => {
          const x = 40 + i * 45;
          const active = i <= 4;
          const fontSize = 14 + i * 4;
          return (
            <g key={i} transform={`translate(${x} 90)`}>
              <circle r={fontSize + 2} fill={active ? (i === 4 ? accent.bg : t.lineSoft) : 'none'} stroke={active ? 'none' : t.line} strokeWidth="1" strokeDasharray="2 3"/>
              <text fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="700" fontSize={fontSize} textAnchor="middle" dominantBaseline="middle" fill={active ? (i === 4 ? accent.fg : t.muted) : t.faint}>
                ×{i}
              </text>
            </g>
          );
        })}
        {/* line connecting */}
        <line x1="60" y1="90" x2="240" y2="90" stroke={t.line} strokeWidth="1" strokeDasharray="3 3"/>
        <text x="150" y="160" fontFamily="'JetBrains Mono', monospace" fontSize="9" letterSpacing="1.3" textAnchor="middle" fill={t.muted}>4 ACIERTOS SEGUIDOS · ×2 XP</text>
      </svg>
    );
  }

  // Ilustración 03 — XP que sube
  function IllustrationXP({ t, accent, size }) {
    const s = size;
    return (
      <svg width={s} height={s * 0.6} viewBox="0 0 300 180">
        {/* bars */}
        {[40, 70, 110, 90, 140].map((h, i) => {
          const x = 30 + i * 50;
          const active = i === 4;
          return (
            <g key={i}>
              <rect x={x} y={160 - h} width="32" height={h} rx="3" fill={active ? accent.bg : t.lineSoft}/>
              <text x={x + 16} y="175" fontFamily="'JetBrains Mono', monospace" fontSize="8" letterSpacing="1" textAnchor="middle" fill={t.faint}>{['LUN','MAR','MIÉ','JUE','VIE'][i]}</text>
            </g>
          );
        })}
        {/* current label */}
        <g transform="translate(246 30)">
          <rect x="-50" y="-12" width="100" height="22" rx="11" fill={t.ink}/>
          <text fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="700" fontSize="11" textAnchor="middle" dominantBaseline="middle" fill={t.bg}>+340 XP HOY</text>
        </g>
        <path d="M 226 32 L 226 18" stroke={t.ink} strokeWidth="1.5" markerEnd="url(#arr)"/>
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={t.ink}/>
          </marker>
        </defs>
      </svg>
    );
  }

  const STEPS = [
    {
      n: 1, total: 3,
      tag: 'CÓMO FUNCIONA · 01',
      title: 'Tienes 5 vidas.',
      body: 'Cada fallo te resta una. Si las pierdes todas, esperas 20 minutos o repasas la lección — pero nunca te bloqueamos.',
      reassure: 'No pasa nada por fallar. Aquí no se castiga.',
      illustration: 'hearts',
    },
    {
      n: 2, total: 3,
      tag: 'CÓMO FUNCIONA · 02',
      title: 'Encadena aciertos.',
      body: 'Cada respuesta correcta seguida sube tu combo. A partir de ×3 multiplicamos la XP que ganas — sin trampas.',
      reassure: 'El combo se reinicia al fallar, pero tus aciertos no se pierden.',
      illustration: 'combo',
    },
    {
      n: 3, total: 3,
      tag: 'CÓMO FUNCIONA · 03',
      title: 'Gana XP, sube de nivel.',
      body: 'XP es el termómetro de tu progreso. Sumas con cada lección, cada quiz y cada examen. No se pierde nunca.',
      reassure: 'Cada nivel desbloquea retos opcionales y nuevos diplomas.',
      illustration: 'xp',
    },
  ];

  function Slide({ step, t, accent, mobile, illustrationSize }) {
    const Illu = step.illustration === 'hearts' ? IllustrationHearts
              : step.illustration === 'combo' ? IllustrationCombo
              : IllustrationXP;
    return (
      <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: t.sans, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: mobile ? '14px 20px' : '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <button style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', padding: 0, display: 'grid', placeItems: 'center' }}>
            <Icon name="x" size={20}/>
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ width: 32, height: 4, borderRadius: 2, background: i <= step.n ? t.ink : t.line }}/>
            ))}
          </div>
          <button style={{ background: 'none', border: 'none', color: t.muted, fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0 }}>Saltar</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: mobile ? '12px 24px' : '20px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', overflow: 'auto' }}>
          <div style={{ marginBottom: mobile ? 18 : 28 }}>
            <Illu t={t} accent={accent} size={illustrationSize}/>
          </div>

          <Mono color={t.faint}>{step.tag}</Mono>
          <h1 style={{
            margin: '12px 0 0',
            fontFamily: t.serif, fontWeight: 500,
            fontSize: mobile ? 36 : 56, letterSpacing: -1.4, lineHeight: 1.02,
            maxWidth: 680,
          }}>
            {step.title}
          </h1>
          <p style={{ margin: '16px 0 0', fontSize: mobile ? 15 : 17, lineHeight: 1.55, color: t.muted, maxWidth: 480 }}>
            {step.body}
          </p>
          <div style={{ marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: t.dark ? 'rgba(200,245,66,0.08)' : accent.soft, color: accent.bg === '#C8F542' ? '#3F5A0A' : accent.bg, fontSize: 12.5, fontWeight: 600 }}>
            <Icon name="sparkle" size={13}/> {step.reassure}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: mobile ? '16px 24px 26px' : '24px 56px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${t.line}`, flexShrink: 0, gap: 10 }}>
          <Button kind="ghost" icon="arrowL" size={mobile ? 'sm' : 'md'} style={{ borderColor: t.line, color: t.muted, opacity: step.n === 1 ? 0.4 : 1 }}>
            {!mobile && 'Atrás'}
          </Button>
          <Mono color={t.faint}>0{step.n} / 0{step.total}</Mono>
          <Button bg={accent.bg} fg={accent.fg} iconRight="arrowR" size={mobile ? 'sm' : 'md'}>
            {step.n === step.total ? 'Empezar quiz' : 'Siguiente'}
          </Button>
        </div>
      </div>
    );
  }

  // Exposición — un slide por componente
  export function Onboarding1Desktop({ tweak }: { tweak?: TweakOptions }) { const t = useTheme(tweak); return <Slide step={STEPS[0]} t={t} accent={t.A} illustrationSize={360}/>; };
  export function Onboarding2Desktop({ tweak }: { tweak?: TweakOptions }) { const t = useTheme(tweak); return <Slide step={STEPS[1]} t={t} accent={t.A} illustrationSize={360}/>; };
  export function Onboarding3Desktop({ tweak }: { tweak?: TweakOptions }) { const t = useTheme(tweak); return <Slide step={STEPS[2]} t={t} accent={t.A} illustrationSize={360}/>; };
  export function Onboarding1Mobile({ tweak }: { tweak?: TweakOptions }) { const t = useTheme(tweak); return <Slide step={STEPS[0]} t={t} accent={t.A} mobile illustrationSize={260}/>; };
  export function Onboarding2Mobile({ tweak }: { tweak?: TweakOptions }) { const t = useTheme(tweak); return <Slide step={STEPS[1]} t={t} accent={t.A} mobile illustrationSize={260}/>; };
  export function Onboarding3Mobile({ tweak }: { tweak?: TweakOptions }) { const t = useTheme(tweak); return <Slide step={STEPS[2]} t={t} accent={t.A} mobile illustrationSize={260}/>; };
