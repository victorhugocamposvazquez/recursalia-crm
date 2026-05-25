// @ts-nocheck — see README for typing guidance on internal helpers
'use client';
import React from 'react';
import { useTheme, Logo, Icon, Button, Progress, Chip, Mono, fmt } from './tokens';
import { mockCourse as course, mockModules as modules } from '@/lib/learn-mock';
import { generateDiplomaPDF } from './diploma-pdf';
import type { TweakOptions } from './types';

/* components/learn/diploma.tsx — Diploma final + variantes compartibles
   - DiplomaDesktop      → vista completa de la página del diploma con acciones
   - DiplomaMobile       → vista mobile (preview centrado + acciones abajo)
   - DiplomaShareLinkedIn→ tarjeta cuadrada optimizada para LinkedIn / redes
   Estilo: moderno minimalista, mucho blanco, tipografía protagonista. */

// El "papel" del diploma — reutilizable a distintos tamaños
  function DiplomaPaper({ accent, scale = 1, dark = false }) {
    // Always light paper for legibility; accent injects color
    const ink = '#0A0A14', paper = '#FFFFFF', muted = '#6B6B7A', line = 'rgba(10,10,20,0.08)';
    const brand = '#1b38c4';
    const px = (n) => n * scale;
    return (
      <div style={{
        position: 'relative',
        width: px(680), height: px(480),
        background: paper, color: ink,
        boxShadow: '0 60px 120px -60px rgba(10,10,20,0.35), 0 20px 40px -20px rgba(10,10,20,0.18)',
        borderRadius: px(6),
        overflow: 'hidden',
        flexShrink: 0,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        {/* Texture subtle */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.5, backgroundImage: `radial-gradient(${line} 1px, transparent 1px)`, backgroundSize: '24px 24px', pointerEvents: 'none' }}/>

        {/* Corner marks */}
        {[[16,16,'tl'],[null,16,'tr'],[16,null,'bl'],[null,null,'br']].map(([l,top,k]) => (
          <div key={k} style={{ position: 'absolute', left: l != null ? px(20) : 'auto', right: l == null ? px(20) : 'auto', top: top != null ? px(20) : 'auto', bottom: top == null ? px(20) : 'auto', width: px(18), height: px(18), borderTop: k.includes('t') ? `1px solid ${ink}` : 'none', borderBottom: k.includes('b') ? `1px solid ${ink}` : 'none', borderLeft: k.includes('l') ? `1px solid ${ink}` : 'none', borderRight: k.includes('r') ? `1px solid ${ink}` : 'none' }}/>
        ))}

        {/* Header */}
        <div style={{ position: 'absolute', top: px(36), left: px(48), right: px(48), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: px(8) }}>
            <Logo size={px(22)} color={ink} withText={true}/>
            <span style={{ width: px(6), height: px(6), borderRadius: '50%', background: brand, display: 'inline-block' }}/>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: px(10), letterSpacing: 1.4, color: brand, textTransform: 'uppercase', fontWeight: 600 }}>
            Diploma · Núm. RX-2026-0428
          </div>
        </div>

        {/* Title block */}
        <div style={{ position: 'absolute', top: px(100), left: px(48), right: px(48) }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: px(11), letterSpacing: 2, color: accent.bg === '#C8F542' ? '#5A7B0E' : accent.bg, textTransform: 'uppercase' }}>
            Certifica que
          </div>
          <div style={{
            marginTop: px(18),
            fontFamily: "var(--font-learn-sans), 'Plus Jakarta Sans', system-ui, sans-serif",
            fontWeight: 500,
            fontSize: px(60),
            letterSpacing: px(-2),
            lineHeight: 0.95,
            color: ink,
          }}>
            Hugo Marín Sastre
          </div>
          <div style={{ marginTop: px(20), fontSize: px(13), color: muted, lineHeight: 1.5, maxWidth: px(540) }}>
            Ha completado satisfactoriamente el programa formativo
          </div>
          <div style={{
            marginTop: px(10),
            fontFamily: "var(--font-learn-sans), 'Plus Jakarta Sans', system-ui, sans-serif",
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: px(28),
            letterSpacing: px(-0.8),
            lineHeight: 1.1,
            color: ink,
            maxWidth: px(560),
          }}>
            Captura el mundo a través de tu lente.
          </div>
          <div style={{ marginTop: px(10), fontSize: px(12), color: muted }}>
            14 lecciones · 4 h 38 min · Examen final superado con un 90%
          </div>
        </div>

        {/* Bottom: firmas y sello */}
        <div style={{ position: 'absolute', bottom: px(36), left: px(48), right: px(48), display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: px(20) }}>
          {/* Firma izq */}
          <div>
            <svg width={px(120)} height={px(36)} viewBox="0 0 120 36" style={{ display: 'block' }}>
              <path d="M3 26 C 12 8, 22 32, 30 18 S 48 8, 56 22 C 64 30, 74 14, 84 22 C 92 28, 102 12, 116 18" stroke={ink} strokeWidth="1.4" fill="none" strokeLinecap="round"/>
              <path d="M3 26 L 22 26" stroke={ink} strokeWidth="0.8" fill="none"/>
            </svg>
            <div style={{ marginTop: px(6), height: 1, background: ink, opacity: 0.9, width: px(160) }}/>
            <div style={{ marginTop: px(6), fontSize: px(12), fontWeight: 600, color: ink }}>Lucía Vega</div>
            <div style={{ fontSize: px(10), color: muted, marginTop: px(2) }}>Fotógrafa · Instructora</div>
          </div>

          {/* Sello acento */}
          <div style={{ position: 'relative', width: px(96), height: px(96), borderRadius: px(48), background: accent.bg, display: 'grid', placeItems: 'center', color: accent.fg, flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: px(6), borderRadius: '50%', border: `1px dashed ${accent.fg}55` }}/>
            <div style={{ textAlign: 'center', position: 'relative' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: px(8), letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.7 }}>Verificado</div>
              <div style={{ fontFamily: "var(--font-learn-sans), 'Plus Jakarta Sans', system-ui, sans-serif", fontSize: px(22), fontWeight: 600, fontStyle: 'italic', lineHeight: 1, marginTop: px(2) }}>★</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: px(8), letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.7, marginTop: px(2) }}>Recursalia</div>
            </div>
          </div>

          {/* Firma der */}
          <div style={{ textAlign: 'right' }}>
            <svg width={px(120)} height={px(36)} viewBox="0 0 120 36" style={{ display: 'block', marginLeft: 'auto' }}>
              <path d="M3 22 C 16 28, 30 8, 44 24 C 56 36, 68 6, 84 20 C 96 28, 108 14, 117 20" stroke={ink} strokeWidth="1.4" fill="none" strokeLinecap="round"/>
            </svg>
            <div style={{ marginTop: px(6), height: 1, background: ink, opacity: 0.9, width: px(160), marginLeft: 'auto' }}/>
            <div style={{ marginTop: px(6), fontSize: px(12), fontWeight: 600, color: ink }}>Eric Roldán</div>
            <div style={{ fontSize: px(10), color: muted, marginTop: px(2) }}>CEO · Recursalia</div>
          </div>
        </div>

        {/* Verification footer */}
        <div style={{ position: 'absolute', bottom: px(12), left: px(48), right: px(48), display: 'flex', justifyContent: 'space-between', fontFamily: "'JetBrains Mono', monospace", fontSize: px(9), letterSpacing: 1, color: muted, textTransform: 'uppercase' }}>
          <span>Emitido · 22 may 2026</span>
          <span style={{ color: brand, fontWeight: 600 }}>recursalia.app/verify/rx-2026-0428</span>
        </div>
      </div>
    );
  }

  // ── DIPLOMA DESKTOP ───────────────────────────────────────────────────────
  export function DiplomaDesktop({ tweak }: { tweak?: TweakOptions }) {
    const t = useTheme(tweak);
    const { A: accent } = t;
    return (
      <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: t.sans, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div style={{ padding: '18px 32px', borderBottom: `1px solid ${t.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <button style={{ background: 'none', border: 'none', color: t.muted, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0 }}>
            <Icon name="chevL" size={16}/> Mis diplomas
          </button>
          <Logo size={22} color={t.ink} withText/>
          <div style={{ width: 130 }}/>
        </div>

        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          {/* Stage */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', background: t.dark ? '#0E0E18' : 'linear-gradient(180deg, #F4F4F0, #ECECE6)', overflow: 'auto' }}>
            <div style={{ transform: 'scale(0.86)', transformOrigin: 'center' }}>
              <DiplomaPaper accent={accent} scale={1}/>
            </div>
          </div>

          {/* Right rail */}
          <aside style={{ width: 340, background: t.surface, borderLeft: `1px solid ${t.line}`, padding: '32px 28px', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
            <Mono color={t.faint}>DIPLOMA · RX-2026-0428</Mono>
            <h1 style={{ margin: '8px 0 0', fontSize: 26, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.1 }}>
              Captura el mundo a través de tu lente.
            </h1>
            <div style={{ marginTop: 6, fontSize: 13, color: t.muted }}>Hugo Marín Sastre · 22 may 2026</div>

            {/* Actions */}
            <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button bg={t.ink} fg={t.bg} icon="download" size="lg" style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => generateDiplomaPDF({ accentHex: accent.bg, accentInk: accent.fg })}>
                Descargar PDF · A4
              </Button>
              <Button bg={'#0A66C2'} fg={'#FFFFFF'} icon="linkedin" size="md" style={{ width: '100%', justifyContent: 'center' }}>
                Añadir a mi LinkedIn
              </Button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Button kind="ghost" icon="share" size="md" style={{ borderColor: t.line, color: t.ink, justifyContent: 'center' }}>Compartir</Button>
                <Button kind="ghost" icon="doc" size="md" style={{ borderColor: t.line, color: t.ink, justifyContent: 'center' }}>Vista pública</Button>
              </div>
            </div>

            {/* Verification */}
            <div style={{ marginTop: 26, padding: '14px 16px', borderRadius: 12, background: t.dark ? 'rgba(255,255,255,0.04)' : t.surface2, border: `1px solid ${t.line}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: t.brand }}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: t.brandInk }}>
                <Icon name="shield" size={16}/>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Diploma verificable</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: t.muted, lineHeight: 1.5 }}>
                Cualquiera con tu URL puede comprobar que es auténtico. Incluye QR para escanear desde papel.
              </div>
              <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: t.bg, border: `1px solid ${t.line}`, fontFamily: t.mono, fontSize: 11, color: t.brandInk, wordBreak: 'break-all', fontWeight: 600 }}>
                recursalia.app/verify/rx-2026-0428
              </div>
            </div>

            {/* Stats */}
            <div style={{ marginTop: 22 }}>
              <Mono color={t.faint}>RESUMEN</Mono>
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: t.line, borderRadius: 12, overflow: 'hidden', border: `1px solid ${t.line}` }}>
                {[
                  ['Nota final', '90%'],
                  ['Lecciones', '14 / 14'],
                  ['Quizzes', '4 / 4'],
                  ['Horas dedicadas', '4 h 38 m'],
                ].map(([k, v], i) => (
                  <div key={i} style={{ background: t.surface, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: t.muted }}>{k}</div>
                    <div style={{ marginTop: 2, fontSize: 16, fontWeight: 700, color: t.ink }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  };

  // ── DIPLOMA MOBILE ────────────────────────────────────────────────────────
  export function DiplomaMobile({ tweak }: { tweak?: TweakOptions }) {
    const t = useTheme(tweak);
    const { A: accent } = t;
    return (
      <div style={{ width: '100%', height: '100%', background: t.dark ? '#0E0E18' : '#ECECE6', color: t.ink, fontFamily: t.sans, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <button style={{ background: 'none', border: 'none', color: t.muted, display: 'grid', placeItems: 'center', padding: 0, cursor: 'pointer' }}>
            <Icon name="chevL" size={20}/>
          </button>
          <Mono color={t.muted} size={10}>DIPLOMA · RX-2026-0428</Mono>
          <button style={{ background: 'none', border: 'none', color: t.muted, display: 'grid', placeItems: 'center', padding: 0, cursor: 'pointer' }}>
            <Icon name="share" size={20}/>
          </button>
        </div>

        {/* Stage */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '0 16px' }}>
          <div style={{ transform: 'scale(0.5) rotate(0deg)', transformOrigin: 'center' }}>
            <DiplomaPaper accent={accent} scale={1}/>
          </div>
        </div>

        {/* Bottom actions sheet */}
        <div style={{ background: t.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 20px 26px', borderTop: `1px solid ${t.line}`, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: t.line, margin: '0 auto 16px' }}/>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: -0.4 }}>Tu diploma está listo</h2>
          <p style={{ margin: '4px 0 16px', fontSize: 13, color: t.muted, lineHeight: 1.4 }}>
            Comparte tu logro en LinkedIn o descárgalo en PDF de alta calidad.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button bg={'#0A66C2'} fg={'#FFFFFF'} icon="linkedin" size="lg" style={{ width: '100%', justifyContent: 'center' }}>
              Añadir a mi LinkedIn
            </Button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Button kind="ghost" icon="download" size="md" style={{ borderColor: t.line, color: t.ink, justifyContent: 'center' }}
                onClick={() => generateDiplomaPDF({ accentHex: accent.bg, accentInk: accent.fg })}>Descargar</Button>
              <Button kind="ghost" icon="share" size="md" style={{ borderColor: t.line, color: t.ink, justifyContent: 'center' }}>Compartir</Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── COMPARTIBLE LINKEDIN (TARJETA SOCIAL) ─────────────────────────────────
  // Pensado como una tarjeta cuadrada para post de LinkedIn (1080×1080 escalado)
  export function DiplomaShareLinkedIn({ tweak, format = 'feed' }: { tweak?: TweakOptions; format?: 'feed' | 'story' }) {
    const t = useTheme(tweak);
    const { A: accent } = t;
    const isStory = format === 'story';
    return (
      <div style={{ width: '100%', height: '100%', background: '#0A0A14', color: '#F4F4F0', fontFamily: t.sans, padding: 24, overflow: 'auto' }}>
        <Mono color="rgba(244,244,240,0.5)">PREVIEW · TARJETAS COMPARTIBLES</Mono>
        <h2 style={{ margin: '6px 0 22px', fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>Listas para LinkedIn y redes</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
          {/* Card horizontal LinkedIn post (1200x630-ish) */}
          <div style={{
            position: 'relative', borderRadius: 18, overflow: 'hidden',
            background: '#FFFFFF', color: '#0A0A14',
            aspectRatio: '1200 / 630',
            padding: '36px 40px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.4, backgroundImage: `radial-gradient(rgba(10,10,20,0.08) 1px, transparent 1px)`, backgroundSize: '20px 20px' }}/>

            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Logo size={22} color="#0A0A14" withText/>
              <Mono color="#1b38c4" size={9} style={{ fontWeight: 600 }}>DIPLOMA · MAY 2026</Mono>
            </div>

            <div style={{ position: 'relative' }}>
              <Mono color="#1b38c4" size={10} style={{ fontWeight: 600 }}>HUGO MARÍN HA COMPLETADO</Mono>
              <div style={{
                marginTop: 10,
                fontFamily: t.sans, fontWeight: 700,
                fontSize: 44, letterSpacing: -1.2, lineHeight: 1,
                maxWidth: '85%',
              }}>
                Captura el mundo a través de tu lente.
              </div>
              <div style={{ marginTop: 14, fontSize: 13, color: '#6B6B7A' }}>
                14 lecciones · Examen final 90% · Con <span style={{ color: '#0A0A14', fontWeight: 600 }}>Lucía Vega</span>
              </div>
            </div>

            {/* Sello */}
            <div style={{ position: 'absolute', right: 36, bottom: 36, width: 84, height: 84, borderRadius: '50%', background: accent.bg, display: 'grid', placeItems: 'center', color: accent.fg }}>
              <div style={{ position: 'absolute', inset: 5, borderRadius: '50%', border: `1px dashed ${accent.fg}66` }}/>
              <div style={{ fontFamily: t.sans, fontWeight: 700, fontStyle: 'italic', fontSize: 24 }}>★</div>
            </div>
          </div>

          {/* Card cuadrada IG */}
          <div style={{
            position: 'relative', borderRadius: 18, overflow: 'hidden',
            background: accent.bg, color: accent.fg,
            aspectRatio: '1 / 1', padding: 28,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Logo size={18} color={accent.fg} withText/>
              <Mono color={accent.fg} size={9} style={{ opacity: 0.6 }}>DIPLOMA</Mono>
            </div>
            <div>
              <div style={{ fontFamily: t.sans, fontWeight: 700, fontSize: 28, letterSpacing: -0.9, lineHeight: 1, fontStyle: 'italic' }}>
                Captura el mundo a través de tu lente.
              </div>
              <div style={{ marginTop: 18, fontSize: 11, fontFamily: t.mono, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.7 }}>
                Hugo Marín · 22.05.2026
              </div>
            </div>
          </div>
        </div>

        {/* LinkedIn UI preview */}
        <div style={{ marginTop: 22, background: '#1B1F23', borderRadius: 14, padding: 18, border: '1px solid rgba(255,255,255,0.08)' }}>
          <Mono color="rgba(244,244,240,0.5)">SIMULACIÓN · POST EN LINKEDIN</Mono>
          <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 42, height: 42, borderRadius: 21, background: `linear-gradient(135deg, ${accent.bg}, #1b38c4)`, flexShrink: 0 }}/>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Hugo Marín Sastre</div>
              <div style={{ fontSize: 12, color: 'rgba(244,244,240,0.55)' }}>Product Designer · hace 2 min</div>
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.5, color: 'rgba(244,244,240,0.9)' }}>
            ¡Acabo de completar <span style={{ color: accent.bg, fontWeight: 600 }}>Captura el mundo a través de tu lente</span> en Recursalia. Cuatro meses aprendiendo a mirar antes que a disparar — y la mejor parte es que hay otro curso esperándome. <span style={{ color: '#8EA1FF' }}>#fotografía #recursalia</span>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: '#8EA1FF', fontFamily: t.mono, fontWeight: 600 }}>📎 Ver diploma · recursalia.app/verify/rx-2026-0428</div>
        </div>
      </div>
    );
  };
