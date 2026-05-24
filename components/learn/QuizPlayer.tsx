'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme, Icon, Button, Mono } from '@/components/learn/tokens';
import type { QuizQuestionRecord } from '@/types';

type Props = {
  courseId: string;
  courseSlug: string;
  quizId: string;
  title: string;
  isFinal?: boolean;
  questions: QuizQuestionRecord[];
  backHref: string;
};

export function QuizPlayer({
  courseId,
  courseSlug,
  quizId,
  title,
  isFinal,
  questions,
  backHref,
}: Props) {
  const router = useRouter();
  const t = useTheme({});
  const { A: accent } = t;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);

  const q = questions[index];
  const progress = questions.length ? (index + 1) / questions.length : 0;

  const payload = useMemo(() => {
    if (!q) return {};
    return (q.payload ?? {}) as Record<string, unknown>;
  }, [q]);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const body = {
        courseId,
        answers: questions.map((question) => ({
          questionId: question.id,
          given: answers[question.id] ?? null,
        })),
      };
      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al enviar');

      if (data.passed && isFinal) {
        await fetch('/api/diploma/issue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, attemptId: data.attemptId }),
        });
      }

      router.push(`/aprender/cursos/${courseSlug}/resultados/${data.attemptId}`);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'No se pudo enviar el quiz');
    } finally {
      setSubmitting(false);
    }
  }

  function pickAnswer(value: unknown) {
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  }

  function goNext() {
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
    } else {
      void handleSubmit();
    }
  }

  if (!questions.length) {
    return (
      <div style={{ padding: 48, maxWidth: 520, margin: '0 auto', fontFamily: t.sans }}>
        <h1 style={{ fontSize: 22 }}>Sin preguntas</h1>
        <p style={{ color: t.muted }}>Este quiz aún no tiene preguntas configuradas.</p>
        <Button kind="ghost" onClick={() => router.push(backHref)} style={{ marginTop: 16 }}>
          Volver al curso
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: t.bg,
        color: t.ink,
        fontFamily: t.sans,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${t.line}`,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: t.surface,
        }}
      >
        <button
          type="button"
          onClick={() => router.push(backHref)}
          style={{
            background: 'none',
            border: 'none',
            color: t.muted,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Icon name="chevL" size={16} />
          Volver
        </button>
        <div style={{ flex: 1 }}>
          <Mono color={t.faint}>{isFinal ? 'EXAMEN FINAL' : 'QUIZ'}</Mono>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
        </div>
        <Mono color={t.muted}>
          {index + 1}/{questions.length}
        </Mono>
      </header>

      <div style={{ height: 4, background: t.lineSoft }}>
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: accent.bg,
            transition: 'width .2s ease',
          }}
        />
      </div>

      <main style={{ flex: 1, padding: '32px 24px', maxWidth: 720, margin: '0 auto', width: '100%' }}>
        <h2 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.25 }}>
          {q.text}
        </h2>

        {q.kind === 'tf' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Verdadero', value: true },
              { label: 'Falso', value: false },
            ].map((opt) => {
              const selected = answers[q.id] === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => pickAnswer(opt.value)}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 14,
                    border: selected ? `2px solid ${t.ink}` : `1px solid ${t.line}`,
                    background: selected ? (t.dark ? 'rgba(255,255,255,0.06)' : '#fff') : t.surface,
                    textAlign: 'left',
                    fontSize: 16,
                    fontWeight: selected ? 600 : 500,
                    cursor: 'pointer',
                    color: t.ink,
                    fontFamily: 'inherit',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {((payload.options as { id: string; text: string }[]) ?? []).map((opt) => {
              const selected = answers[q.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => pickAnswer(opt.id)}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 14,
                    border: selected ? `2px solid ${t.ink}` : `1px solid ${t.line}`,
                    background: selected ? (t.dark ? 'rgba(255,255,255,0.06)' : '#fff') : t.surface,
                    textAlign: 'left',
                    fontSize: 16,
                    fontWeight: selected ? 600 : 500,
                    cursor: 'pointer',
                    color: t.ink,
                    fontFamily: 'inherit',
                  }}
                >
                  {opt.text}
                </button>
              );
            })}
          </div>
        )}

        {q.hint ? (
          <p style={{ marginTop: 20, fontSize: 14, color: t.muted, lineHeight: 1.5 }}>
            Pista: {q.hint}
          </p>
        ) : null}
      </main>

      <footer
        style={{
          padding: '16px 24px 24px',
          borderTop: `1px solid ${t.line}`,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          background: t.surface,
        }}
      >
        <Button
          kind="ghost"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          style={{ color: t.muted, borderColor: t.line }}
        >
          Anterior
        </Button>
        <Button
          bg={accent.bg}
          fg={accent.fg}
          iconRight={index < questions.length - 1 ? 'arrowR' : 'check'}
          onClick={goNext}
          disabled={answers[q.id] === undefined || submitting}
        >
          {submitting
            ? 'Enviando…'
            : index < questions.length - 1
              ? 'Siguiente'
              : 'Enviar respuestas'}
        </Button>
      </footer>
    </div>
  );
}
