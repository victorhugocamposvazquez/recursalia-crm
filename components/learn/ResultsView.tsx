'use client';

import { useRouter } from 'next/navigation';
import { useTheme, Button, Mono, Icon } from '@/components/learn/tokens';

type Props = {
  courseSlug: string;
  passed: boolean;
  scorePct: number;
  xpEarned: number;
  isFinal: boolean;
  certNumber?: string | null;
};

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
  const { A: accent } = t;

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: t.bg,
        color: t.ink,
        fontFamily: t.sans,
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          padding: 32,
          borderRadius: 20,
          background: t.surface,
          border: `1px solid ${t.line}`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            margin: '0 auto 20px',
            background: passed ? accent.bg : '#fee2e2',
            color: passed ? accent.fg : '#991b1b',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon name={passed ? 'trophy' : 'target'} size={32} />
        </div>

        <Mono color={t.faint}>{isFinal ? 'EXAMEN FINAL' : 'QUIZ'}</Mono>
        <h1 style={{ margin: '8px 0 12px', fontSize: 28, fontWeight: 800, letterSpacing: -0.8 }}>
          {passed ? '¡Aprobado!' : 'Sigue practicando'}
        </h1>
        <p style={{ margin: '0 0 24px', color: t.muted, lineHeight: 1.55 }}>
          Has obtenido un <strong>{scorePct}%</strong>
          {xpEarned > 0 ? ` y +${xpEarned} XP` : ''}.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {passed && isFinal && certNumber ? (
            <Button
              bg={accent.bg}
              fg={accent.fg}
              icon="doc"
              onClick={() => router.push(`/aprender/diplomas/${certNumber}`)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Ver diploma
            </Button>
          ) : null}
          <Button
            kind="ghost"
            icon="arrowR"
            onClick={() => router.push(`/aprender/cursos/${courseSlug}`)}
            style={{ width: '100%', justifyContent: 'center', borderColor: t.line, color: t.ink }}
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
