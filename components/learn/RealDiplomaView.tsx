'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTheme, Logo, Icon, Button, Mono } from '@/components/learn/tokens';

type Props = {
  studentName: string;
  courseTitle: string;
  instructorName: string;
  certNumber: string;
  shareToken?: string | null;
  scorePct: number;
  totalLessons: number;
  totalDurationMinutes?: number;
  issuedAt: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDuration(min?: number) {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h <= 0) return `${m} min`;
  return m ? `${h} h ${m} m` : `${h} h`;
}

export function RealDiplomaView({
  studentName,
  courseTitle,
  instructorName,
  certNumber,
  shareToken,
  scorePct,
  totalLessons,
  totalDurationMinutes,
  issuedAt,
}: Props) {
  const router = useRouter();
  const t = useTheme({});
  const { A: accent } = t;
  const [copied, setCopied] = useState(false);
  const verifyPath = shareToken ? `/verify/${shareToken}` : null;
  const verifyUrl =
    typeof window !== 'undefined' && verifyPath
      ? `${window.location.origin}${verifyPath}`
      : verifyPath
        ? `recursalia.app${verifyPath}`
        : null;

  const stats: Array<[string, string]> = [
    ['Nota final', `${scorePct}%`],
    ['Lecciones', `${totalLessons}`],
  ];
  const dur = formatDuration(totalDurationMinutes);
  if (dur) stats.push(['Duración', dur]);
  stats.push(['Emitido', formatDate(issuedAt)]);

  async function handleCopy() {
    if (!verifyUrl) return;
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        background: t.bg,
        color: t.ink,
        fontFamily: t.sans,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '18px 32px',
          borderBottom: `1px solid ${t.line}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          type="button"
          onClick={() => router.push('/aprender')}
          style={{
            background: 'none',
            border: 'none',
            color: t.muted,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <Icon name="chevL" size={16} /> Mis cursos
        </button>
        <Logo size={22} color={t.ink} withText />
        <div style={{ width: 110 }} />
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: 0,
            padding: '28px clamp(16px, 4vw, 40px)',
            background: t.dark ? '#0E0E18' : 'linear-gradient(180deg, #F4F4F0, #ECECE6)',
          }}
        >
          <div
            style={{
              maxWidth: 760,
              width: '100%',
              margin: '0 auto',
              background: '#fff',
              color: '#0A0A14',
              borderRadius: 14,
              padding: 'clamp(22px, 4vw, 44px)',
              border: '1px solid rgba(10,10,20,0.08)',
              boxShadow: '0 30px 60px -30px rgba(10,10,20,0.25)',
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 32,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Logo size={22} color="#0A0A14" withText />
              </div>
              <Mono color="#1b38c4" size={11}>
                Diploma · {certNumber}
              </Mono>
            </div>

            <Mono color="#1b38c4" size={11}>
              Certifica que
            </Mono>
            <div
              style={{
                marginTop: 12,
                fontFamily: "var(--font-learn-sans), 'Plus Jakarta Sans', system-ui, sans-serif",
                fontWeight: 500,
                fontSize: 'clamp(34px, 6vw, 60px)',
                letterSpacing: -1.5,
                lineHeight: 0.98,
              }}
            >
              {studentName}
            </div>

            <div style={{ marginTop: 18, color: '#6B6B7A', fontSize: 14 }}>
              Ha completado satisfactoriamente el programa formativo
            </div>
            <div
              style={{
                marginTop: 10,
                fontFamily: "var(--font-learn-sans), 'Plus Jakarta Sans', system-ui, sans-serif",
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(20px, 3.4vw, 28px)',
                letterSpacing: -0.6,
                lineHeight: 1.15,
              }}
            >
              {courseTitle}.
            </div>
            <div style={{ marginTop: 10, fontSize: 12.5, color: '#6B6B7A' }}>
              {totalLessons} {totalLessons === 1 ? 'lección' : 'lecciones'}
              {dur ? ` · ${dur}` : ''} · Nota {scorePct}%
            </div>

            <div
              style={{
                marginTop: 40,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 24,
              }}
            >
              <div>
                <div style={{ width: 160, height: 1, background: '#0A0A14' }} />
                <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 600 }}>{instructorName}</div>
                <div style={{ fontSize: 11, color: '#6B6B7A', marginTop: 2 }}>Instructor del curso</div>
              </div>

              <div
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: 43,
                  background: accent.bg,
                  color: accent.fg,
                  display: 'grid',
                  placeItems: 'center',
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 6,
                    borderRadius: '50%',
                    border: `1px dashed ${accent.fg}55`,
                  }}
                />
                <div style={{ textAlign: 'center', position: 'relative' }}>
                  <div
                    style={{
                      fontFamily: t.mono,
                      fontSize: 8,
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                      opacity: 0.7,
                    }}
                  >
                    Verificado
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-learn-sans), 'Plus Jakarta Sans', system-ui, sans-serif",
                      fontSize: 22,
                      fontWeight: 600,
                      fontStyle: 'italic',
                      lineHeight: 1,
                      marginTop: 2,
                    }}
                  >
                    ★
                  </div>
                  <div
                    style={{
                      fontFamily: t.mono,
                      fontSize: 8,
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                      opacity: 0.7,
                      marginTop: 2,
                    }}
                  >
                    Recursalia
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ width: 160, height: 1, background: '#0A0A14', marginLeft: 'auto' }} />
                <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 600 }}>Eric Roldán</div>
                <div style={{ fontSize: 11, color: '#6B6B7A', marginTop: 2 }}>CEO · Recursalia</div>
              </div>
            </div>

            <div
              style={{
                marginTop: 28,
                paddingTop: 14,
                borderTop: '1px solid rgba(10,10,20,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: t.mono,
                fontSize: 10,
                letterSpacing: 1,
                color: '#6B6B7A',
                textTransform: 'uppercase',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <span>Emitido · {formatDate(issuedAt)}</span>
              {verifyUrl ? (
                <span style={{ color: '#1b38c4', fontWeight: 600, wordBreak: 'break-all' }}>
                  {verifyUrl.replace(/^https?:\/\//, '')}
                </span>
              ) : null}
            </div>
          </div>

          <div
            style={{
              maxWidth: 760,
              width: '100%',
              margin: '24px auto 0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
            }}
          >
            {stats.map(([k, v]) => (
              <div
                key={k}
                style={{
                  background: t.surface,
                  border: `1px solid ${t.line}`,
                  borderRadius: 12,
                  padding: '14px 16px',
                }}
              >
                <div style={{ fontSize: 11, color: t.muted }}>{k}</div>
                <div style={{ marginTop: 2, fontSize: 18, fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              maxWidth: 760,
              width: '100%',
              margin: '20px auto 0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              justifyContent: 'space-between',
            }}
          >
            {verifyUrl ? (
              <Button
                bg={t.ink}
                fg={t.bg}
                icon="share"
                onClick={handleCopy}
                style={{ flex: '1 1 220px', justifyContent: 'center' }}
              >
                {copied ? 'Enlace copiado' : 'Copiar enlace público'}
              </Button>
            ) : null}
            {verifyPath ? (
              <Button
                kind="ghost"
                icon="doc"
                onClick={() => window.open(verifyPath, '_blank')}
                style={{
                  flex: '1 1 220px',
                  justifyContent: 'center',
                  borderColor: t.line,
                  color: t.ink,
                }}
              >
                Abrir vista pública
              </Button>
            ) : null}
            <Button
              kind="ghost"
              icon="arrowL"
              onClick={() => router.push('/aprender')}
              style={{
                flex: '1 1 200px',
                justifyContent: 'center',
                borderColor: t.line,
                color: t.muted,
              }}
            >
              Volver a mis cursos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
