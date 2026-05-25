// @ts-nocheck — see README for typing guidance on internal helpers
'use client';
import React from 'react';
import { useTheme, Logo, Icon, Button, Progress, Chip, Mono, fmt } from './tokens';
import { mockCourse, mockModules } from '@/lib/learn-mock';
import { useLearnDataOptional } from '@/lib/learn/context';
import type { TweakOptions } from './types';

const BRAND = '#1b38c4';

/* components/learn/dashboard.tsx — "Mis cursos"
   Vista general del estudiante: cursos en progreso, recomendados, racha,
   y un pequeño resumen de logros. Diseño editorial: tipografía protagonista,
   tarjetas con jerarquía clara (no cards de catálogo genéricas). */

// Datos de ejemplo del dashboard
  const enrolled = [
    {
      slug: 'captura-el-mundo',
      title: 'Captura el mundo a través de tu lente',
      instructor: 'Lucía Vega',
      pct: 0.42, nextLesson: '2.2 Líneas, formas y patrones',
      time: '2h 40m restantes', tag: 'FOTOGRAFÍA', current: true,
    },
    {
      slug: 'redaccion-clara',
      title: 'Escribe como si hablaras (pero mejor)',
      instructor: 'Marcos del Río',
      pct: 0.78, nextLesson: '4.3 Cortar para enfocar',
      time: '52 min restantes', tag: 'ESCRITURA',
    },
    {
      slug: 'productividad-ritmica',
      title: 'Productividad rítmica · trabaja con tu energía',
      instructor: 'Andrea Cano',
      pct: 0.15, nextLesson: '1.2 Detecta tus picos',
      time: '4h restantes', tag: 'HÁBITOS',
    },
  ];

  const completed = [
    { title: 'Negociación amable', instructor: 'Inés Vallejo', date: '12 abr', score: 96 },
    { title: 'Excel sin sufrir',    instructor: 'David Cuadros', date: '03 mar', score: 88 },
  ];

  const recommended = [
    { title: 'Retrato natural — el rostro como paisaje', instructor: 'Lucía Vega', tag: 'FOTO · INTERMEDIO', reason: 'Continúa tu camino fotográfico' },
    { title: 'El primer borrador es siempre una mentira', instructor: 'Marcos del Río', tag: 'ESCRITURA',   reason: 'Porque completaste «Redacción clara»' },
    { title: 'Sin reuniones · cómo asíncrono se hace',     instructor: 'Lena Tobar',     tag: 'EQUIPOS',     reason: 'Nuevo esta semana' },
  ];

  function formatToday() {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).toUpperCase();
  }

  function firstName(name?: string) {
    if (!name) return 'Alumno';
    return name.split(/[\s@]/)[0];
  }

  // ── TARJETA DE CURSO EN PROGRESO ────────────────────────────────────────────
  function CourseCard({ c, t, accent, large, mobile, onOpen }) {
    const notStarted = (c.pct ?? 0) <= 0;
    const cta = large
      ? (notStarted ? 'Empezar' : 'Reanudar')
      : (notStarted ? 'Empezar' : 'Continuar');
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => e.key === 'Enter' && onOpen?.()}
        style={{
        position: 'relative', overflow: 'hidden',
        background: large ? `linear-gradient(145deg, ${BRAND} 0%, #142a99 100%)` : t.surface,
        color: large ? '#ffffff' : t.ink,
        borderRadius: 18,
        border: large ? 'none' : `1px solid ${t.line}`,
        padding: mobile ? 18 : (large ? 28 : 22),
        display: 'flex', flexDirection: 'column', gap: mobile ? 14 : 18,
        minHeight: large ? (mobile ? 'auto' : 280) : 'auto',
        cursor: onOpen ? 'pointer' : 'default',
        boxShadow: large ? '0 16px 40px -16px rgb(27 56 196 / 45%)' : 'none',
      }}>
        {large && (
          <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: 110, background: 'radial-gradient(circle, rgb(255 255 255 / 18%), transparent 70%)', pointerEvents: 'none' }}/>
        )}

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Mono color={large ? 'rgb(255 255 255 / 80%)' : t.faint} size={10}>{c.tag}</Mono>
          {c.current && (
            large
              ? <Chip size="sm" bg="#ffffff" color={BRAND} mono>EN CURSO</Chip>
              : <Chip size="sm" bg={accent.bg} color={accent.fg} mono>EN CURSO</Chip>
          )}
        </div>

        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{ fontFamily: large ? t.serif : t.sans, fontWeight: large ? 500 : 700, fontSize: mobile ? 22 : (large ? 32 : 19), letterSpacing: large ? -1 : -0.4, lineHeight: 1.05, color: 'inherit' }}>
            {c.title}
          </div>
          <div style={{ marginTop: 6, fontSize: 12.5, opacity: large ? 0.8 : 0.7 }}>con {c.instructor}</div>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Mono color={large ? 'rgb(255 255 255 / 65%)' : t.faint} size={10}>{notStarted ? 'EMPIEZA AHORA' : 'SIGUIENTE'}</Mono>
            <Mono color={large ? 'rgb(255 255 255 / 65%)' : t.faint} size={10}>{Math.round(c.pct*100)}%</Mono>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {c.nextLesson}
          </div>
          <Progress value={c.pct} color={large ? '#ffffff' : accent.bg} track={large ? 'rgba(255,255,255,0.22)' : t.lineSoft} height={5}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            <span style={{ fontSize: 12, opacity: large ? 0.75 : 0.6 }}>{c.time}</span>
            <Button bg={large ? '#ffffff' : t.ink} fg={large ? BRAND : t.bg} icon="play" size="sm">
              {cta}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── TARJETA DE CURSO COMPLETADO ────────────────────────────────────────────
  function CompletedCard({ c, t, accent, onOpen }) {
    return (
      <div
        role={onOpen ? 'button' : undefined}
        tabIndex={onOpen ? 0 : undefined}
        onClick={onOpen}
        onKeyDown={(e) => e.key === 'Enter' && onOpen?.()}
        style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', borderRadius: 14,
        background: t.dark ? 'rgba(255,255,255,0.04)' : t.surface2,
        border: `1px solid ${t.line}`,
        cursor: onOpen ? 'pointer' : 'default',
      }}>
        <div style={{ width: 40, height: 40, borderRadius: 20, background: accent.bg, color: accent.fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name="trophy" size={18}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
          <div style={{ fontSize: 12, color: t.muted }}>{c.instructor} · Completado {c.date}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: t.mono, fontSize: 14, fontWeight: 700, color: t.ink }}>{c.score}%</div>
          <Mono color={t.faint} size={9}>NOTA</Mono>
        </div>
      </div>
    );
  }

  // ── TARJETA RECOMENDADA ────────────────────────────────────────────────────
  function RecCard({ c, t, accent }) {
    return (
      <div style={{
        padding: 18, borderRadius: 16, background: t.surface, border: `1px solid ${t.line}`,
        display: 'flex', flexDirection: 'column', gap: 12, height: '100%',
      }}>
        <div style={{ height: 80, borderRadius: 10, background: `linear-gradient(135deg, ${accent.bg}, #1b38c4)`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, background: 'repeating-linear-gradient(45deg, #FFF 0 1px, transparent 1px 12px)' }}/>
        </div>
        <Mono color={t.faint} size={10}>{c.tag}</Mono>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.2, color: t.ink, flex: 1 }}>{c.title}</div>
        <div style={{ fontSize: 12, color: t.muted }}>con {c.instructor}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: `1px solid ${t.line}` }}>
          <Icon name="sparkle" size={14}/>
          <span style={{ fontSize: 11.5, color: t.muted, flex: 1 }}>{c.reason}</span>
          <Icon name="arrowR" size={14}/>
        </div>
      </div>
    );
  }

  // ── DASHBOARD DESKTOP ──────────────────────────────────────────────────────
  export function DashboardDesktop({ tweak }: { tweak?: TweakOptions }) {
    const learn = useLearnDataOptional();
    const enrolledList = learn?.enrolled ?? enrolled;
    const completedList = learn?.completed ?? completed;
    const onCourseOpen = learn?.onCourseOpen;
    const onOpenCatalog = learn?.onOpenCatalog;
    const onOpenDiploma = learn?.onOpenDiploma;
    const stats = learn?.stats;
    const userName = firstName(learn?.userName);
    const t = useTheme(tweak);
    const { A: accent } = t;
    const main = enrolledList[0];
    const others = enrolledList.slice(1);
    const open = (slug: string) => () => onCourseOpen?.(slug);
    const hasCourses = enrolledList.length > 0;

    return (
      <div style={{ width: '100%', minHeight: '100%', background: t.bg, color: t.ink, fontFamily: t.sans, display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: '100%', maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
          {/* Header */}
          <div style={{ padding: '32px 0 24px', borderBottom: `1px solid ${t.line}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
              <div>
                <Mono color={t.faint}>{formatToday()}</Mono>
                <h1 style={{ margin: '6px 0 0', fontSize: 42, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1 }}>
                  Hola {userName},{hasCourses ? (
                    <> continúa <br/>
                    <span style={{ background: `linear-gradient(transparent 60%, ${accent.bg}aa 60%)`, padding: '0 4px' }}>aprendiendo</span>.</>
                  ) : (
                    <> aún no tienes cursos matriculados.</>
                  )}
                </h1>
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                <StatBig t={t} accent={accent} label="RACHA" value={String(stats?.streak_days ?? 5)} sub="días seguidos" icon="flame"/>
                <StatBig t={t} accent={accent} label="XP TOTAL" value={fmt.n(stats?.xp ?? 2840)} sub="+120 esta semana" icon="bolt"/>
                <StatBig t={t} accent={accent} label="NIVEL" value={String(stats?.level ?? 7).padStart(2, '0')} sub="Aprendiz constante" icon="star" brand/>
              </div>
            </div>
          </div>

          {/* En curso */}
          <section style={{ padding: '32px 0 12px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
                En curso · {enrolledList.length} {enrolledList.length === 1 ? 'curso' : 'cursos'}
              </h2>
            </div>
            {!hasCourses ? (
              <div style={{ padding: '32px 24px', borderRadius: 16, border: `1px dashed ${t.line}`, textAlign: 'center', color: t.muted, background: t.surface }}>
                <p style={{ margin: '0 0 16px' }}>Cuando compres un curso, te matricularán con tu email y aparecerá aquí.</p>
                <Button kind="ghost" onClick={onOpenCatalog} style={{ borderColor: t.line, color: t.ink }}>Explorar catálogo</Button>
              </div>
            ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 16 }}>
              {main ? <CourseCard c={main} t={t} accent={accent} large onOpen={open(main.slug)}/> : null}
              {others.map(c => <CourseCard key={c.slug} c={c} t={t} accent={accent} onOpen={open(c.slug)}/>)}
            </div>
            )}
          </section>

          {hasCourses ? null : (
          <section style={{ padding: '28px 0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <Mono color={t.faint}>PARA TI</Mono>
                <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>Explora el catálogo</h2>
              </div>
            </div>
            <Button kind="ghost" iconRight="arrowR" onClick={onOpenCatalog} style={{ borderColor: t.line, color: t.ink }}>
              Ver todos los cursos
            </Button>
          </section>
          )}

          {/* Completados */}
          {completedList.length > 0 ? (
          <section style={{ padding: '28px 0 50px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: -0.4 }}>
                Completados · {completedList.length} {completedList.length === 1 ? 'curso' : 'cursos'}
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {completedList.map((c, i) => (
                <CompletedCard
                  key={i}
                  c={c}
                  t={t}
                  accent={accent}
                  onOpen={c.certNumber ? () => onOpenDiploma?.(c.certNumber) : undefined}
                />
              ))}
            </div>
          </section>
          ) : null}
        </div>
      </div>
    );
  };

  function StatBig({ t, accent, label, value, sub, icon, brand }) {
    const labelColor = brand ? t.brandInk : (accent.bg === '#C8F542' ? (t.dark ? accent.bg : '#5A7B0E') : accent.bg);
    return (
      <div style={{ minWidth: 140, padding: '14px 18px', borderRadius: 16, background: t.surface, border: `1px solid ${t.line}`, position: 'relative', overflow: 'hidden' }}>
        {brand && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: t.brand }}/>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: labelColor }}>
          <Icon name={icon} size={14}/>
          <Mono color="currentColor" size={10}>{label}</Mono>
        </div>
        <div style={{ marginTop: 6, fontSize: 30, fontWeight: 800, letterSpacing: -0.8, color: t.ink, lineHeight: 1 }}>{value}</div>
        <div style={{ marginTop: 3, fontSize: 11, color: t.muted }}>{sub}</div>
      </div>
    );
  }

  // ── DASHBOARD MOBILE ───────────────────────────────────────────────────────
  export function DashboardMobile({ tweak }: { tweak?: TweakOptions }) {
    const learn = useLearnDataOptional();
    const enrolledList = learn?.enrolled ?? enrolled;
    const completedList = learn?.completed ?? completed;
    const onCourseOpen = learn?.onCourseOpen;
    const onOpenCatalog = learn?.onOpenCatalog;
    const onOpenDiploma = learn?.onOpenDiploma;
    const stats = learn?.stats;
    const userName = firstName(learn?.userName);
    const t = useTheme(tweak);
    const { A: accent } = t;
    const open = (slug: string) => () => onCourseOpen?.(slug);
    const hasCourses = enrolledList.length > 0;
    return (
      <div style={{ width: '100%', minHeight: '100%', background: t.bg, color: t.ink, fontFamily: t.sans, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '14px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <Chip size="sm" bg={accent.bg} color={accent.fg} icon="fire">{stats?.streak_days ?? 5}</Chip>
          <Chip size="sm" border={`1px solid ${t.line}`} color={t.ink} icon="bolt">{fmt.n(stats?.xp ?? 2840)}</Chip>
        </div>

        <div style={{ flex: 1, padding: '18px 18px 40px' }}>
          <Mono color={t.faint}>{formatToday()}</Mono>
          <h1 style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: -1, lineHeight: 1.05 }}>
            Hola {userName}. {hasCourses ? (
              <>Continúa <span style={{ background: `linear-gradient(transparent 60%, ${accent.bg}aa 60%)`, padding: '0 3px' }}>aprendiendo</span>.</>
            ) : 'Aún no tienes cursos.'}
          </h1>

          {!hasCourses ? (
            <div style={{ marginTop: 22, padding: 20, borderRadius: 16, border: `1px dashed ${t.line}`, color: t.muted, textAlign: 'center' }}>
              <p style={{ margin: '0 0 12px' }}>Tras la compra te matricularán con tu email.</p>
              <Button kind="ghost" onClick={onOpenCatalog} style={{ borderColor: t.line, color: t.ink }}>Ver catálogo</Button>
            </div>
          ) : (
          <>
          <div style={{ marginTop: 22 }}>
            {enrolledList[0] ? (
              <CourseCard c={enrolledList[0]} t={t} accent={accent} large mobile onOpen={open(enrolledList[0].slug)}/>
            ) : null}
          </div>

          {/* Tag row */}
          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>Otros en curso</h2>
            <button style={{ background: 'none', border: 'none', color: t.muted, fontSize: 12, fontWeight: 500 }}>Ver todos</button>
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {enrolledList.slice(1).map(c => <CourseCard key={c.slug} c={c} t={t} accent={accent} mobile onOpen={open(c.slug)}/>)}
          </div>
          </>
          )}

          {completedList.length > 0 ? (
          <div style={{ marginTop: 22 }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>Completados</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {completedList.map((c, i) => (
                <CompletedCard
                  key={i}
                  c={c}
                  t={t}
                  accent={accent}
                  onOpen={c.certNumber ? () => onOpenDiploma?.(c.certNumber) : undefined}
                />
              ))}
            </div>
          </div>
          ) : null}
        </div>
        {/* Bottom nav (oculto: el LearnTopbar ya gestiona la navegación) */}
        <div style={{ display: 'none' }}>
          {[
            { ic: 'grid', label: 'Cursos', active: true, action: learn?.onGoHome },
            { ic: 'doc', label: 'Diplomas', action: completedList[0]?.certNumber ? () => onOpenDiploma?.(completedList[0].certNumber) : undefined },
          ].map((it, i) => (
            <button key={i} type="button" onClick={it.action} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: it.active ? t.ink : t.faint, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              <Icon name={it.ic} size={20}/>
              <span style={{ fontSize: 10, fontWeight: it.active ? 700 : 500 }}>{it.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };
