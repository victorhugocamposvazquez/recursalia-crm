// @ts-nocheck — see README for typing guidance on internal helpers
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useTheme, Logo, Icon, Button, Progress, Chip, Mono, fmt } from './tokens';
import { mockCourse as course, mockModules as modules } from '@/lib/learn-mock';
import { useLearnDataOptional } from '@/lib/learn/context';
import type { TweakOptions } from './types';

const BRAND = '#1b38c4';

/* components/learn/lesson.tsx — Vistas de lección
   - LessonVideoDesktop / LessonVideoMobile: vídeo + sidebar con índice
   - LessonTextDesktop  / LessonTextMobile : lectura larga (artículo)
   Comparten un layout: topbar con progreso/breadcrumb, contenido, footer-nav. */

// ── BARRA DE PROGRESO DE LECTURA ──────────────────────────────────────────
  function ReadingProgressBar({ scrollRef, accent }) {
    const [pct, setPct] = useState(0);
    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      const update = () => {
        const max = el.scrollHeight - el.clientHeight;
        const value = max > 0 ? el.scrollTop / max : 0;
        setPct(Math.max(0, Math.min(1, value)));
      };
      update();
      el.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      return () => {
        el.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
      };
    }, [scrollRef]);
    return (
      <div style={{ position: 'sticky', top: 0, left: 0, right: 0, height: 3, background: 'transparent', zIndex: 30, flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, background: BRAND, transition: 'width .1s linear' }}/>
      </div>
    );
  }

// ── TOPBAR LECCIÓN ────────────────────────────────────────────────────────
  function LessonTopbar({ t, accent, mobile, current, total, onBack, breadcrumb }) {
    return (
      <div style={{
        padding: mobile ? '12px 16px' : '14px 28px',
        borderBottom: `1px solid ${t.line}`,
        display: 'flex', alignItems: 'center', gap: 16,
        background: t.surface, flexShrink: 0,
      }}>
        <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: t.muted, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0 }}>
          <Icon name="chevL" size={16}/>
          {!mobile && <span>Volver al curso</span>}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          {!mobile && breadcrumb && (
            <Mono color={t.faint}>
              {breadcrumb}
            </Mono>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: mobile ? 0 : 4 }}>
            <div style={{ flex: 1, height: 4, background: t.lineSoft, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(current/total)*100}%`, background: accent.bg, borderRadius: 2 }}/>
            </div>
            <Mono color={t.muted} size={11}>{current}/{total}</Mono>
          </div>
        </div>
        {!mobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{ background: 'none', border: `1px solid ${t.line}`, color: t.muted, width: 34, height: 34, borderRadius: 17, cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Icon name="bookmark" size={16}/></button>
            <Chip size="sm" bg={accent.bg} color={accent.fg} icon="bolt">+25 XP al completar</Chip>
          </div>
        )}
      </div>
    );
  }

  // ── FOOTER NAV LECCIÓN ─────────────────────────────────────────────────────
  function LessonFooter({ t, accent, mobile, prev, next, completed = false, onPrimary, onUnmark, onPrev, loading = false }) {
    return (
      <div style={{
        padding: mobile ? '12px 16px 18px' : '18px 28px',
        borderTop: `1px solid ${t.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, background: t.surface, flexShrink: 0,
      }}>
        <Button kind="ghost" icon="arrowL" size={mobile ? 'sm' : 'md'} style={{ color: t.muted, borderColor: t.line }} onClick={onPrev} disabled={!onPrev}>
          {mobile ? '' : (prev || 'Anterior')}
        </Button>
        {!mobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: completed ? BRAND : t.muted, fontSize: 13, fontWeight: completed ? 600 : 500 }}>
            <Icon name={completed ? 'check' : 'clock'} size={14} sw={completed ? 2.5 : 1.8}/>
            <span>{completed ? 'Lección completada' : 'Progreso guardado al completar'}</span>
          </div>
        )}
        {completed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button
              kind="ghost"
              size="sm"
              icon="circle"
              onClick={onUnmark}
              disabled={loading}
              style={{ color: t.muted, borderColor: t.line, padding: mobile ? '8px 12px' : '8px 14px' }}
            >
              Desmarcar
            </Button>
            <Button
              bg={BRAND}
              fg="#ffffff"
              iconRight="arrowR"
              size={mobile ? 'sm' : 'md'}
              onClick={onPrimary}
              disabled={loading}
            >
              {loading ? 'Guardando…' : (mobile ? 'Siguiente' : 'Siguiente lección')}
            </Button>
          </div>
        ) : (
          <Button
            bg={accent.bg}
            fg={accent.fg}
            icon="check"
            iconRight="arrowR"
            size={mobile ? 'sm' : 'md'}
            onClick={onPrimary}
            disabled={loading}
          >
            {loading ? 'Guardando…' : 'Marcar como completada'}
          </Button>
        )}
      </div>
    );
  }

  // ── SIDEBAR INDICE DESKTOP ─────────────────────────────────────────────────
  function LessonSidebar({ t, accent, currentId, modules, courseTitle, onOpen }) {
    return (
      <aside style={{ width: 300, background: t.surface, borderLeft: `1px solid ${t.line}`, padding: '22px 18px', overflowY: 'auto', flexShrink: 0 }}>
        <Mono color={t.faint}>EN ESTE CURSO</Mono>
        <h3 style={{ margin: '6px 0 18px', fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>{courseTitle}</h3>

        {modules.map(m => (
          <div key={m.n} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Mono color={t.faint} size={10}>{String(m.n).padStart(2,'0')}</Mono>
              <span style={{ fontSize: 13, fontWeight: 700, color: t.ink }}>{m.title}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginLeft: 4 }}>
              {m.lessons.map(l => {
                const active = l.id === currentId;
                const done = l.state === 'done';
                const locked = l.state === 'locked';
                return (
                  <button key={l.id} type="button" onClick={() => !locked && onOpen?.(l.id, l.kind)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 8px', borderRadius: 8, background: active ? (t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(10,10,20,0.04)') : 'transparent',
                    border: 'none', cursor: locked ? 'not-allowed' : 'pointer', textAlign: 'left',
                    color: 'inherit', fontFamily: 'inherit',
                    opacity: locked ? 0.5 : 1,
                  }}>
                    <div style={{ width: 16, height: 16, borderRadius: 8, display: 'grid', placeItems: 'center', background: done ? accent.bg : 'transparent', border: done ? 'none' : `1.2px solid ${t.line}`, color: done ? accent.fg : t.faint, flexShrink: 0 }}>
                      {done ? <Icon name="check" size={10} sw={3}/> : (locked ? <Icon name="lock" size={9}/> : null)}
                    </div>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: active ? 600 : 500, color: active ? t.ink : t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {l.title}
                    </span>
                    <span style={{ fontSize: 11, color: t.faint, fontFamily: t.mono, flexShrink: 0 }}>{l.dur.replace(' min','′').replace(' preguntas','q')}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </aside>
    );
  }

  // ── PLAYER VIDEO (placeholder) ─────────────────────────────────────────────
  function VideoPlayer({ t, accent, mobile }) {
    return (
      <div style={{
        position: 'relative', borderRadius: mobile ? 0 : 18, overflow: 'hidden',
        aspectRatio: '16 / 9', background: '#0A0A14',
        boxShadow: mobile ? 'none' : '0 30px 60px -30px rgba(10,10,20,0.4)',
      }}>
        {/* Subtle gradient as placeholder */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 40%, rgba(200,245,66,0.12), transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(31,43,217,0.18), transparent 70%), linear-gradient(135deg, #14141F 0%, #050510 100%)' }}/>
        {/* Stripes (placeholder marker) */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, background: 'repeating-linear-gradient(45deg, #FFF 0 1px, transparent 1px 14px)' }}/>

        {/* Camera frame deco */}
        <svg style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.3 }} width="180" height="120" viewBox="0 0 180 120">
          <rect x="2" y="20" width="176" height="80" rx="6" stroke="#C8F542" strokeWidth="1.5" fill="none"/>
          <circle cx="90" cy="60" r="22" stroke="#C8F542" strokeWidth="1.5" fill="none"/>
          <circle cx="90" cy="60" r="12" stroke="#C8F542" strokeWidth="1" fill="none"/>
          <rect x="76" y="10" width="28" height="14" rx="2" stroke="#C8F542" strokeWidth="1.5" fill="none"/>
        </svg>

        {/* Play button */}
        <button style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: mobile ? 64 : 84, height: mobile ? 64 : 84, borderRadius: '50%',
          background: accent.bg, color: accent.fg, border: 'none',
          display: 'grid', placeItems: 'center', cursor: 'pointer',
          boxShadow: `0 0 0 8px rgba(255,255,255,0.08), 0 0 0 22px rgba(255,255,255,0.04)`,
        }}>
          <Icon name="play" size={mobile ? 26 : 34}/>
        </button>

        {/* Bottom controls bar */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: mobile ? '12px 14px' : '16px 22px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', color: '#FFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Icon name="play" size={mobile ? 16 : 18}/></button>
            <span style={{ fontSize: 11, fontFamily: t.mono }}>00:00 / 09:24</span>
            <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: '0%', height: '100%', background: accent.bg }}/>
            </div>
            <button style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Icon name="sound" size={mobile ? 16 : 18}/></button>
            {!mobile && <Mono color="rgba(255,255,255,0.6)" size={10}>HD · 1×</Mono>}
          </div>
        </div>

        {/* Chip top-left */}
        <div style={{ position: 'absolute', top: mobile ? 12 : 18, left: mobile ? 12 : 18 }}>
          <Chip size="sm" bg="rgba(255,255,255,0.15)" color="#FFF" border="1px solid rgba(255,255,255,0.18)" mono>LECCIÓN 2.3 · VÍDEO</Chip>
        </div>
      </div>
    );
  }

  // ── CONTENIDO BAJO EL VIDEO ────────────────────────────────────────────────
  function VideoMeta({ t, accent, mobile }) {
    return (
      <div style={{ marginTop: mobile ? 18 : 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: mobile ? 10 : 14 }}>
          <Mono color={t.faint}>MÓDULO 2 · LECCIÓN 2.3</Mono>
        </div>
        <h1 style={{ margin: 0, fontFamily: t.sans, fontSize: mobile ? 26 : 36, fontWeight: 800, letterSpacing: -1, lineHeight: 1.05 }}>
          Hora dorada y luz natural.
        </h1>
        <p style={{ marginTop: mobile ? 10 : 14, fontSize: mobile ? 15 : 17, lineHeight: 1.55, color: t.muted, maxWidth: 640 }}>
          La luz no es solo iluminación: cuenta una historia. En esta lección recorremos los tres momentos del día que cambian para siempre cómo miras una escena.
        </p>

        {/* Chapters / capítulos */}
        <div style={{ marginTop: mobile ? 24 : 32 }}>
          <Mono color={t.faint}>CAPÍTULOS DE ESTA LECCIÓN</Mono>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { time: '00:00', title: 'Por qué la luz importa más que el equipo', active: true },
              { time: '02:14', title: 'Hora dorada: el sol bajo y los tonos cálidos' },
              { time: '04:48', title: 'Hora azul: la temperatura del recuerdo' },
              { time: '06:30', title: 'Cómo planificar tu sesión con apps de tiempo solar' },
              { time: '08:12', title: 'Ejercicio: dispara 10 fotos en 10 minutos' },
            ].map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '10px 12px', borderRadius: 10,
                background: c.active ? (t.dark ? 'rgba(255,255,255,0.04)' : t.surface2) : 'transparent',
                cursor: 'pointer',
              }}>
                <Mono color={c.active ? accent.bg === '#C8F542' ? (t.dark ? accent.bg : '#5A7B0E') : accent.bg : t.faint} size={11}>{c.time}</Mono>
                <span style={{ flex: 1, fontSize: mobile ? 13 : 14, fontWeight: c.active ? 600 : 500, color: c.active ? t.ink : t.muted }}>{c.title}</span>
                {c.active && <Icon name="play" size={12}/>}
              </div>
            ))}
          </div>
        </div>

        {/* Recursos */}
        <div style={{ marginTop: mobile ? 24 : 32 }}>
          <Mono color={t.faint}>RECURSOS</Mono>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: mobile ? 'column' : 'row', gap: 10, flexWrap: 'wrap' }}>
            {[
              { ic: 'doc', label: 'Tabla de horas doradas (PDF)' },
              { ic: 'headphones', label: 'Versión audio · 18 min' },
              { ic: 'download', label: 'Presets Lightroom · luz cálida' },
            ].map((r, i) => (
              <button key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 12,
                background: t.dark ? 'rgba(255,255,255,0.04)' : t.surface2,
                border: `1px solid ${t.line}`,
                color: t.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
              }}>
                <Icon name={r.ic} size={15}/>
                <span style={{ flex: 1, textAlign: 'left' }}>{r.label}</span>
                <Icon name="arrowR" size={14}/>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── LESSON VIDEO DESKTOP ───────────────────────────────────────────────────
  export function LessonVideoDesktop({ tweak }: { tweak?: TweakOptions }) {
    const t = useTheme(tweak);
    const { A: accent } = t;
    return (
      <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: t.sans, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <LessonTopbar t={t} accent={accent} current={8} total={14}/>
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <main style={{ flex: 1, padding: '28px 36px 40px', overflowY: 'auto' }}>
            <VideoPlayer t={t} accent={accent}/>
            <VideoMeta t={t} accent={accent}/>
          </main>
          <LessonSidebar t={t} accent={accent} currentId="2.3"/>
        </div>
        <LessonFooter t={t} accent={accent} prev="2.2 Líneas y patrones" next="2.q Quiz"/>
      </div>
    );
  };

  // ── LESSON VIDEO MOBILE ────────────────────────────────────────────────────
  export function LessonVideoMobile({ tweak }: { tweak?: TweakOptions }) {
    const t = useTheme(tweak);
    const { A: accent } = t;
    return (
      <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: t.sans, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <LessonTopbar t={t} accent={accent} mobile current={8} total={14}/>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <VideoPlayer t={t} accent={accent} mobile/>
          <div style={{ padding: '0 18px 20px' }}>
            <VideoMeta t={t} accent={accent} mobile/>
          </div>
        </div>
        <LessonFooter t={t} accent={accent} mobile/>
      </div>
    );
  };

  // ── TEXTO (LECTURA LARGA) ──────────────────────────────────────────────────
  // Componente del cuerpo: artículo editorial con dropcap, citas, callouts.
  function ArticleBody({ t, accent, mobile }) {
    const learn = useLearnDataOptional();
    const bodyFs = mobile ? 16 : 18;
    const headFs = mobile ? 22 : 28;

    if (learn?.lessonHtml) {
      const lessonUuid = learn.lessonUuid;
      const allModules = learn.modules ?? [];
      const moduleInfo = (() => {
        for (const m of allModules) {
          const idx = m.lessons.findIndex((l) => l.id === lessonUuid);
          if (idx >= 0) {
            return { moduleN: m.n, moduleTitle: m.title, lessonCode: m.lessons[idx].code ?? `${m.n}.${idx + 1}` };
          }
        }
        return null;
      })();
      return (
        <article style={{ maxWidth: mobile ? '100%' : 680, margin: '0 auto', padding: mobile ? '0' : '0 0 60px' }}>
          {moduleInfo && (
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Chip mono size="sm" bg={BRAND} color="#ffffff">MÓDULO {String(moduleInfo.moduleN).padStart(2,'0')}</Chip>
              <Mono color={t.muted}>Lección {moduleInfo.lessonCode}</Mono>
              <span style={{ color: t.faint }}>·</span>
              <Mono color={t.faint} style={{ textTransform: 'none', letterSpacing: 0.4, fontSize: 11 }}>{moduleInfo.moduleTitle}</Mono>
            </div>
          )}
          <h1 style={{ margin: 0, fontFamily: t.sans, fontWeight: 700, fontSize: mobile ? 30 : 44, letterSpacing: -1, lineHeight: 1.08, color: t.ink }}>
            {learn.lessonTitle ?? 'Lección'}
          </h1>
          <div
            style={{ marginTop: 28, fontSize: bodyFs, lineHeight: 1.7, color: t.ink, fontFamily: t.sans }}
            dangerouslySetInnerHTML={{ __html: learn.lessonHtml }}
          />
        </article>
      );
    }

    return (
      <article style={{ maxWidth: mobile ? '100%' : 680, margin: '0 auto', padding: mobile ? '0' : '0 0 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Mono color={t.faint}>MÓDULO 2 · LECCIÓN 2.2 · LECTURA</Mono>
          <span style={{ color: t.faint }}>·</span>
          <Mono color={t.faint}>12 MIN</Mono>
        </div>

        <h1 style={{ margin: 0, fontFamily: t.sans, fontWeight: 700, fontSize: mobile ? 30 : 44, letterSpacing: -1, lineHeight: 1.08, color: t.ink }}>
          Líneas, formas y patrones.
        </h1>
        <p style={{ marginTop: 14, fontSize: bodyFs, color: t.muted, lineHeight: 1.5, fontFamily: t.sans, fontStyle: 'italic' }}>
          Una imagen no es lo que tu cámara captura — es lo que tu ojo organiza dentro del encuadre. Aprende a ver antes que a disparar.
        </p>

        <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${t.line}`, display: 'flex', alignItems: 'center', gap: 14, color: t.muted, fontSize: 13 }}>
          <div style={{ width: 32, height: 32, borderRadius: 16, background: `linear-gradient(135deg, ${accent.bg}, #1b38c4)` }}/>
          <div>
            <span style={{ color: t.ink, fontWeight: 600 }}>Lucía Vega</span> · 8 min de lectura · Actualizado mar 2026
          </div>
        </div>

        {/* Body */}
        <div style={{ marginTop: 28, fontSize: bodyFs, lineHeight: 1.7, color: t.ink, fontFamily: t.sans }}>
          <p style={{ margin: 0 }}>
            <span style={{ float: 'left', fontSize: bodyFs * 3.4, lineHeight: 0.85, fontWeight: 700, marginRight: 10, marginTop: 6, color: t.ink, fontFamily: t.sans }}>L</span>
            a primera vez que un fotógrafo profesional revisó mi carpeta me dijo algo que cambió todo: <em>«tus fotos están enfocadas, expuestas y son técnicamente correctas — pero no me llevan a ningún sitio»</em>. Tardé un año en entender qué quería decir.
          </p>

          <p>
            La composición es el lenguaje que hablamos con quien mira nuestras fotos. Y como todo lenguaje, tiene sus reglas, su gramática y, sobre todo, sus pausas. En esta lección vamos a recorrer tres herramientas que te van a parecer obvias <em>después</em> de leerla: líneas, formas y patrones.
          </p>

          <h2 style={{ margin: '36px 0 14px', fontSize: headFs, fontWeight: 600, letterSpacing: -0.6, color: t.ink, fontFamily: t.sans }}>
            01 — Líneas que llevan al ojo
          </h2>
          <p>
            Una línea diagonal cruza la escena y arrastra la mirada con ella. Una línea horizontal calma; una vertical impone presencia. Cuando una línea conecta dos puntos importantes del encuadre, la imagen se siente <em>resuelta</em>.
          </p>

          {/* CALLOUT */}
          <div style={{ margin: '28px 0', padding: mobile ? '18px 18px' : '22px 26px', borderRadius: 14, background: t.dark ? 'rgba(200,245,66,0.06)' : '#FFFFFF', borderLeft: `3px solid ${accent.bg}`, fontFamily: t.sans, fontSize: mobile ? 14 : 15, lineHeight: 1.55, color: t.ink }}>
            <Mono color={t.faint} size={10}>EJERCICIO RÁPIDO · 3 MIN</Mono>
            <div style={{ marginTop: 8, fontWeight: 600, fontSize: mobile ? 15 : 16 }}>
              Abre las últimas 10 fotos de tu galería.
            </div>
            <div style={{ marginTop: 6, color: t.muted }}>
              Cuenta cuántas tienen una línea clara que organiza la escena. No juzgues — solo cuenta. Ese número es tu punto de partida.
            </div>
          </div>

          <h2 style={{ margin: '32px 0 14px', fontSize: headFs, fontWeight: 600, letterSpacing: -0.6, color: t.ink, fontFamily: t.sans }}>
            02 — Formas que estructuran
          </h2>
          <p>
            Los triángulos transmiten tensión; los círculos, atención; los rectángulos, orden. Cuando observas el mundo a través del visor, no busques objetos — busca formas. Una fila de personas en una parada de bus puede ser un rectángulo casi perfecto si esperas el segundo correcto.
          </p>

          {/* PULL QUOTE */}
          <blockquote style={{ margin: '36px 0', padding: 0, borderLeft: 'none', fontFamily: t.sans, fontWeight: 600, fontStyle: 'italic', fontSize: mobile ? 20 : 26, lineHeight: 1.3, letterSpacing: -0.4, color: t.ink }}>
            «No hagas fotos de cosas. Haz fotos de <span style={{ background: `linear-gradient(transparent 60%, ${accent.bg}90 60%)`, padding: '0 2px' }}>formas que casualmente son cosas</span>.»
          </blockquote>

          <h2 style={{ margin: '32px 0 14px', fontSize: headFs, fontWeight: 600, letterSpacing: -0.6, color: t.ink, fontFamily: t.sans }}>
            03 — Patrones que sorprenden cuando se rompen
          </h2>
          <p>
            Un patrón es seductor porque es predecible. Pero la foto memorable casi nunca es la del patrón perfecto — es la del patrón <em>interrumpido</em>: la teja roja entre veinte azules, la persona girada en sentido contrario al resto del público. Encontrar el patrón es fácil; encontrar la grieta es el oficio.
          </p>
        </div>

        {/* End markers */}
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${t.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, border: `1px solid ${t.line}`, background: 'transparent', color: t.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Icon name="heart" size={14}/> 248
            </button>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, border: `1px solid ${t.line}`, background: 'transparent', color: t.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Icon name="bookmark" size={14}/> Guardar
            </button>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, border: `1px solid ${t.line}`, background: 'transparent', color: t.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Icon name="share" size={14}/>
            </button>
          </div>
          <Chip size="sm" bg={accent.bg} color={accent.fg} icon="bolt">+25 XP al completar</Chip>
        </div>
      </article>
    );
  }

  export function LessonTextDesktop({ tweak, completing = false }: { tweak?: TweakOptions; completing?: boolean }) {
    const learn = useLearnDataOptional();
    const t = useTheme(tweak);
    const { A: accent } = t;
    const sidebarModules = learn?.modules ?? [];
    const total = sidebarModules.reduce((s, m) => s + m.lessons.length, 0) || 14;
    const current = learn?.lessonUuid
      ? sidebarModules.flatMap(m => m.lessons).findIndex(l => l.id === learn.lessonUuid) + 1
      : 1;
    const crumb = [learn?.course?.tag, learn?.course?.title].filter(Boolean).join(' · ').toUpperCase();
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const completed = Boolean(learn?.lessonCompleted);
    const primaryAction = completed ? (learn?.onNextLesson) : (learn?.onMarkComplete);
    return (
      <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: t.sans, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <LessonTopbar t={t} accent={accent} current={current || 1} total={total} onBack={learn?.onBackToHub} breadcrumb={crumb}/>
        <ReadingProgressBar scrollRef={scrollRef} accent={accent}/>
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <main ref={scrollRef} style={{ flex: 1, padding: '40px 56px', overflowY: 'auto' }}>
            <ArticleBody t={t} accent={accent}/>
          </main>
          <LessonSidebar t={t} accent={accent} currentId={learn?.lessonUuid} modules={sidebarModules} courseTitle={learn?.course?.title ?? 'Curso'} onOpen={learn?.onLessonOpen}/>
        </div>
        <LessonFooter
          t={t}
          accent={accent}
          completed={completed}
          onPrimary={primaryAction}
          onUnmark={learn?.onUnmarkComplete}
          onPrev={learn?.onPrevLesson}
          loading={completing}
        />
      </div>
    );
  };

  export function LessonTextMobile({ tweak, completing = false }: { tweak?: TweakOptions; completing?: boolean }) {
    const learn = useLearnDataOptional();
    const t = useTheme(tweak);
    const { A: accent } = t;
    const sidebarModules = learn?.modules ?? [];
    const total = sidebarModules.reduce((s, m) => s + m.lessons.length, 0) || 14;
    const current = learn?.lessonUuid
      ? sidebarModules.flatMap(m => m.lessons).findIndex(l => l.id === learn.lessonUuid) + 1
      : 1;
    const crumb = [learn?.course?.tag, learn?.course?.title].filter(Boolean).join(' · ').toUpperCase();
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const completed = Boolean(learn?.lessonCompleted);
    const primaryAction = completed ? (learn?.onNextLesson) : (learn?.onMarkComplete);
    return (
      <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: t.sans, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <LessonTopbar t={t} accent={accent} mobile current={current || 1} total={total} onBack={learn?.onBackToHub} breadcrumb={crumb}/>
        <ReadingProgressBar scrollRef={scrollRef} accent={accent}/>
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 20px' }}>
          <ArticleBody t={t} accent={accent} mobile/>
        </div>
        <LessonFooter
          t={t}
          accent={accent}
          mobile
          completed={completed}
          onPrimary={primaryAction}
          onUnmark={learn?.onUnmarkComplete}
          onPrev={learn?.onPrevLesson}
          loading={completing}
        />
      </div>
    );
  };
