'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  isAdmin: boolean;
};

export function CoursePendingContent({ courseId, courseSlug, courseTitle, isAdmin }: Props) {
  void courseSlug;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function generate() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setFeedback('Generando contenido extendido… (puede tardar unos minutos)');
    try {
      const res = await fetch(`/api/courses/${courseId}/expand`, { method: 'POST' });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; lessons_count?: number }
        | null;
      if (!res.ok) {
        throw new Error(data?.error ?? 'No se pudo generar el contenido extendido');
      }
      setFeedback(`Contenido generado (${data?.lessons_count ?? '?'} lecciones). Cargando curso…`);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
      setFeedback(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          width: '100%',
          padding: 32,
          borderRadius: 18,
          background: '#ffffff',
          border: '1px solid rgb(15 23 42 / 8%)',
          boxShadow: '0 30px 60px -40px rgb(10 10 20 / 25%)',
          textAlign: 'left',
        }}
      >
        <div
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'rgb(27 56 196 / 10%)',
            color: '#1b38c4',
            marginBottom: 14,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 7h16M4 12h16M4 17h10"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: -0.6,
            color: '#0a0a14',
          }}
        >
          Contenido en preparación
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: '#6B6B7A', lineHeight: 1.55 }}>
          El curso <strong style={{ color: '#0a0a14' }}>{courseTitle}</strong> aún no tiene el
          contenido extendido (intro, body, ejercicios, puntos clave) que se muestra al alumno
          dentro de cada lección.
        </p>

        {isAdmin ? (
          <>
            <div
              style={{
                marginTop: 18,
                padding: '12px 14px',
                borderRadius: 10,
                background: 'rgb(27 56 196 / 6%)',
                border: '1px solid rgb(27 56 196 / 18%)',
                fontSize: 13,
                color: '#1b38c4',
                lineHeight: 1.5,
              }}
            >
              <strong>Modo admin.</strong> Puedes lanzar la expansión IA directamente desde aquí o
              hacerlo desde el panel del curso. La generación tarda ~1–3 minutos según la cantidad de
              lecciones.
            </div>

            {feedback ? (
              <p
                style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'rgb(27 56 196 / 8%)',
                  color: '#1b38c4',
                  fontSize: 13,
                }}
              >
                {feedback}
              </p>
            ) : null}
            {error ? (
              <p
                style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'rgb(248 113 113 / 12%)',
                  color: '#b91c1c',
                  fontSize: 13,
                }}
              >
                {error}
              </p>
            ) : null}

            <div style={{ marginTop: 22, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={generate}
                disabled={busy || isPending}
                style={{
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: '1px solid #1b38c4',
                  background: '#1b38c4',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: busy ? 'progress' : 'pointer',
                  opacity: busy ? 0.7 : 1,
                  fontFamily: 'inherit',
                }}
              >
                {busy ? 'Generando…' : 'Generar contenido extendido'}
              </button>
              <Link
                href={`/dashboard/courses/${courseId}`}
                style={{
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: '1px solid rgb(15 23 42 / 12%)',
                  background: '#ffffff',
                  color: '#0a0a14',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Ir al panel del curso →
              </Link>
            </div>
          </>
        ) : (
          <>
            <p style={{ margin: '14px 0 0', fontSize: 13.5, color: '#6B6B7A', lineHeight: 1.55 }}>
              Un administrador lo generará en breve. Si crees que es un error, contáctanos.
            </p>
            <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link
                href="/aprender"
                style={{
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: '1px solid #1b38c4',
                  background: '#1b38c4',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Volver a mis cursos
              </Link>
              <Link
                href="/aprender/catalogo"
                style={{
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: '1px solid rgb(15 23 42 / 12%)',
                  background: '#ffffff',
                  color: '#0a0a14',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Ver el catálogo
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
