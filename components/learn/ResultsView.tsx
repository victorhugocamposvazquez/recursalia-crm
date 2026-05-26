'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme, Button, Mono } from '@/components/learn/tokens';

type Props = {
  courseSlug: string;
  passed: boolean;
  scorePct: number;
  xpEarned: number;
  isFinal: boolean;
  certNumber?: string | null;
};

const BRAND = '#1b38c4';
const GREEN = 'rgb(42, 215, 69)';
const GOLD = '#fbbf24';

export function ResultsView({
  courseSlug,
  passed,
  scorePct,
  xpEarned,
  isFinal,
  certNumber,
}: Props) {
  const router = useRouter();
  const t = useTheme({});

  // Estrellas: 1 (≥60%), 2 (≥80%), 3 (=100%)
  const stars = scorePct >= 100 ? 3 : scorePct >= 80 ? 2 : scorePct >= 60 ? 1 : 0;

  const confetti = useMemo(() => {
    if (!passed) return [];
    const count = isFinal ? 80 : 50;
    const palette = ['#1b38c4', GREEN, GOLD, '#f97316', '#a855f7'];
    return Array.from({ length: count }).map((_, i) => ({
      key: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2.8 + Math.random() * 2.4,
      color: palette[i % palette.length],
      size: 6 + Math.random() * 8,
      rotate: Math.random() * 360,
    }));
  }, [passed, isFinal]);

  const headline = passed
    ? isFinal
      ? '¡Has vencido al boss!'
      : '¡Quiz superado!'
    : 'Sigue practicando';

  const subline = passed
    ? isFinal
      ? 'Has demostrado dominio del curso completo. Tu diploma está listo.'
      : `Acierto del ${scorePct}% — sigue así, te queda menos.`
    : `Necesitas al menos 70% para aprobar. Has sacado ${scorePct}%.`;

  return (
    <div
      style={{
        minHeight: '100dvh',
        background:
          passed && isFinal
            ? `radial-gradient(ellipse at 20% 0%, rgba(251,191,36,0.18), transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(42,215,69,0.16), transparent 60%), ${t.bg}`
            : passed
              ? `radial-gradient(ellipse at 50% 0%, rgba(42,215,69,0.14), transparent 60%), ${t.bg}`
              : t.bg,
        color: t.ink,
        fontFamily: t.sans,
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Confeti */}
      {confetti.length > 0 ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 1,
          }}
        >
          {confetti.map((c) => (
            <span
              key={c.key}
              style={{
                position: 'absolute',
                left: `${c.left}%`,
                top: 0,
                width: c.size,
                height: c.size,
                background: c.color,
                borderRadius: 2,
                animation: `rx-confetti-fall ${c.duration}s linear ${c.delay}s infinite`,
                transform: `rotate(${c.rotate}deg)`,
                opacity: 0.9,
              }}
            />
          ))}
        </div>
      ) : null}

      <div
        style={{
          maxWidth: 520,
          width: '100%',
          padding: 36,
          borderRadius: 24,
          background: t.surface,
          border: `1px solid ${t.line}`,
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
          boxShadow: '0 24px 60px -24px rgba(15,23,42,0.18)',
        }}
      >
        {/* Trofeo / icono */}
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: 46,
            margin: '0 auto 18px',
            background: passed
              ? `linear-gradient(135deg, ${GREEN}, #16a34a)`
              : 'rgba(239,68,68,0.12)',
            color: passed ? '#fff' : '#991b1b',
            display: 'grid',
            placeItems: 'center',
            fontSize: 48,
            boxShadow: passed ? `0 18px 50px -18px ${GREEN}` : 'none',
          }}
        >
          {passed ? (isFinal ? '🏆' : '🎉') : '💪'}
        </div>

        {/* Estrellas */}
        {passed ? (
          <div style={{ display: 'inline-flex', gap: 6, marginBottom: 8 }} aria-label={`${stars} de 3 estrellas`}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  fontSize: 30,
                  color: i < stars ? GOLD : 'rgba(15,23,42,0.15)',
                  filter: i < stars ? `drop-shadow(0 4px 12px ${GOLD}80)` : 'none',
                  transition: 'all .3s',
                  animationDelay: `${i * 0.15}s`,
                }}
              >
                ★
              </span>
            ))}
          </div>
        ) : null}

        <Mono color={t.faint}>
          {isFinal ? 'EXAMEN FINAL' : 'QUIZ'}
        </Mono>
        <h1
          style={{
            margin: '8px 0 10px',
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: -0.8,
            color: passed ? BRAND : t.ink,
          }}
        >
          {headline}
        </h1>
        <p style={{ margin: '0 0 22px', color: t.muted, lineHeight: 1.55, fontSize: 14.5 }}>
          {subline}
        </p>

        {/* Stats row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
            marginBottom: 22,
          }}
        >
          <StatCard t={t} label="Acierto" value={`${scorePct}%`} accent={passed ? GREEN : '#ef4444'} />
          <StatCard t={t} label="XP ganada" value={`+${xpEarned}`} accent={BRAND} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {passed && isFinal && certNumber ? (
            <Button
              bg={GOLD}
              fg="#1a0d00"
              icon="trophy"
              onClick={() => router.push(`/aprender/diplomas/${certNumber}`)}
              style={{ width: '100%', justifyContent: 'center', fontWeight: 800 }}
            >
              Ver tu diploma
            </Button>
          ) : null}
          <Button
            bg={BRAND}
            fg="#ffffff"
            iconRight="arrowR"
            onClick={() => router.push(`/aprender/cursos/${courseSlug}`)}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Volver al curso
          </Button>
          <Button
            kind="ghost"
            onClick={() => router.push('/aprender')}
            style={{ width: '100%', justifyContent: 'center', borderColor: t.line, color: t.muted }}
          >
            Mis cursos
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  t,
  label,
  value,
  accent,
}: {
  t: ReturnType<typeof useTheme>;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 14,
        border: `1px solid ${t.line}`,
        background: `${accent}10`,
        textAlign: 'left',
      }}
    >
      <div
        style={{
          fontFamily: t.mono,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.2,
          color: t.muted,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: -0.4,
          color: accent,
        }}
      >
        {value}
      </div>
    </div>
  );
}
