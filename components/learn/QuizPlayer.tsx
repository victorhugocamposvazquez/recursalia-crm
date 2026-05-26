'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme, Button, Mono } from '@/components/learn/tokens';
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

type ImageOption = { id: string; image_url?: string; alt?: string; label?: string };
type TextOption = { id: string; text: string };

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
    if (!q) return {} as Record<string, unknown>;
    return (q.payload ?? {}) as Record<string, unknown>;
  }, [q]);

  // Inicializa el orden mostrado para preguntas "order" en su primera visita.
  const orderItems = useMemo<TextOption[]>(() => {
    if (!q || q.kind !== 'order') return [];
    const items = (payload.items as TextOption[]) ?? [];
    const stored = answers[q.id] as string[] | undefined;
    if (stored && Array.isArray(stored) && stored.length === items.length) {
      return stored
        .map((id) => items.find((i) => i.id === id))
        .filter((x): x is TextOption => Boolean(x));
    }
    return items;
  }, [q, payload, answers]);

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

  function setAnswer(value: unknown) {
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  }

  function toggleMulti(optionId: string) {
    if (!q) return;
    const current = (answers[q.id] as string[] | undefined) ?? [];
    const next = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];
    setAnswer(next);
  }

  function moveOrder(from: number, to: number) {
    if (to < 0 || to >= orderItems.length) return;
    const copy = [...orderItems];
    const [item] = copy.splice(from, 1);
    if (!item) return;
    copy.splice(to, 0, item);
    setAnswer(copy.map((o) => o.id));
  }

  function isAnswered(): boolean {
    if (!q) return false;
    const v = answers[q.id];
    if (q.kind === 'multi') {
      return Array.isArray(v) && v.length > 0;
    }
    if (q.kind === 'order') {
      // Si nunca se movió, también permitimos avanzar (el alumno valida el orden inicial).
      return true;
    }
    return v !== undefined && v !== null;
  }

  function goNext() {
    if (index < questions.length - 1) {
      // Para "order" sin tocar nada, persistimos el orden tal cual está al avanzar.
      if (q?.kind === 'order' && answers[q.id] === undefined) {
        setAnswer(orderItems.map((o) => o.id));
      }
      setIndex((i) => i + 1);
    } else {
      if (q?.kind === 'order' && answers[q.id] === undefined) {
        setAnswer(orderItems.map((o) => o.id));
      }
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

  if (!q) return null;

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
      <div
        style={{
          padding: '12px 24px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'transparent',
        }}
      >
        <Mono color={t.faint}>{isFinal ? 'EXAMEN FINAL' : 'QUIZ'}</Mono>
        <div style={{ flex: 1, height: 4, background: t.lineSoft, borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progress * 100}%`,
              background: accent.bg,
              transition: 'width .2s ease',
            }}
          />
        </div>
        <Mono color={t.muted}>
          {index + 1}/{questions.length}
        </Mono>
      </div>

      <main style={{ flex: 1, padding: '32px 24px', maxWidth: 720, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 10 }}>
          <Mono color={t.faint}>{kindLabel(q.kind)}</Mono>
        </div>
        <h2 style={{ margin: '0 0 24px', fontFamily: t.sans, fontSize: 24, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.25 }}>
          {q.text}
        </h2>

        {q.kind === 'tf' ? (
          <TrueFalse
            t={t}
            accent={accent}
            value={answers[q.id]}
            onChange={setAnswer}
          />
        ) : null}

        {q.kind === 'single' ? (
          <SingleChoice
            t={t}
            accent={accent}
            options={(payload.options as TextOption[]) ?? []}
            value={answers[q.id] as string | undefined}
            onChange={setAnswer}
          />
        ) : null}

        {q.kind === 'multi' ? (
          <MultiChoice
            t={t}
            accent={accent}
            options={(payload.options as TextOption[]) ?? []}
            value={(answers[q.id] as string[] | undefined) ?? []}
            onToggle={toggleMulti}
          />
        ) : null}

        {q.kind === 'image' ? (
          <ImageChoice
            t={t}
            accent={accent}
            options={(payload.options as ImageOption[]) ?? []}
            value={answers[q.id] as string | undefined}
            onChange={setAnswer}
          />
        ) : null}

        {q.kind === 'order' ? (
          <OrderList
            t={t}
            accent={accent}
            items={orderItems}
            onMove={moveOrder}
          />
        ) : null}

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
          disabled={!isAnswered() || submitting}
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

function kindLabel(kind: QuizQuestionRecord['kind']): string {
  switch (kind) {
    case 'tf':
      return 'VERDADERO / FALSO';
    case 'single':
      return 'OPCIÓN ÚNICA';
    case 'multi':
      return 'SELECCIÓN MÚLTIPLE';
    case 'image':
      return 'VISUAL';
    case 'order':
      return 'ORDENAR PASOS';
    default:
      return 'PREGUNTA';
  }
}

// ── Subcomponentes ─────────────────────────────────────────────────────────

type ThemeArg = ReturnType<typeof useTheme>;
type AccentArg = { bg: string; fg: string };

function TrueFalse({
  t,
  accent,
  value,
  onChange,
}: {
  t: ThemeArg;
  accent: AccentArg;
  value: unknown;
  onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[
        { label: 'Verdadero', value: true },
        { label: 'Falso', value: false },
      ].map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            style={pillStyle(t, accent, selected)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SingleChoice({
  t,
  accent,
  options,
  value,
  onChange,
}: {
  t: ThemeArg;
  accent: AccentArg;
  options: TextOption[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            style={pillStyle(t, accent, selected)}
          >
            {opt.text}
          </button>
        );
      })}
    </div>
  );
}

function MultiChoice({
  t,
  accent,
  options,
  value,
  onToggle,
}: {
  t: ThemeArg;
  accent: AccentArg;
  options: TextOption[];
  value: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ margin: '0 0 4px', fontSize: 13, color: t.muted }}>
        Selecciona todas las opciones correctas.
      </p>
      {options.map((opt) => {
        const selected = value.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            style={{
              ...pillStyle(t, accent, selected),
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: `2px solid ${selected ? accent.bg : t.line}`,
                background: selected ? accent.bg : 'transparent',
                color: accent.fg,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {selected ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12l4 4 10-10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </span>
            <span style={{ flex: 1 }}>{opt.text}</span>
          </button>
        );
      })}
    </div>
  );
}

function ImageChoice({
  t,
  accent,
  options,
  value,
  onChange,
}: {
  t: ThemeArg;
  accent: AccentArg;
  options: ImageOption[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  if (!options.length) {
    return <p style={{ color: t.muted }}>Sin imágenes configuradas.</p>;
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
      }}
    >
      {options.map((opt, idx) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            style={{
              position: 'relative',
              borderRadius: 14,
              overflow: 'hidden',
              border: `2px solid ${selected ? accent.bg : t.line}`,
              background: t.surface,
              cursor: 'pointer',
              padding: 0,
              transform: selected ? 'translateY(-2px)' : 'none',
              boxShadow: selected ? `0 12px 30px -16px ${accent.bg}80` : 'none',
              transition: 'transform .12s ease, border-color .12s ease',
            }}
          >
            <div style={{ aspectRatio: '4 / 3', background: t.lineSoft }}>
              {opt.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={opt.image_url}
                  alt={opt.alt ?? opt.label ?? `Opción ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: '100%',
                    height: '100%',
                    color: t.muted,
                    fontSize: 28,
                    fontWeight: 700,
                  }}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
              )}
            </div>
            <div
              style={{
                padding: '10px 12px',
                textAlign: 'left',
                fontSize: 13,
                fontWeight: 600,
                color: t.ink,
              }}
            >
              {opt.label ?? `Opción ${String.fromCharCode(65 + idx)}`}
            </div>
            {selected ? (
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  background: accent.bg,
                  color: accent.fg,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12l4 4 10-10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function OrderList({
  t,
  accent,
  items,
  onMove,
}: {
  t: ThemeArg;
  accent: AccentArg;
  items: TextOption[];
  onMove: (from: number, to: number) => void;
}) {
  if (!items.length) {
    return <p style={{ color: t.muted }}>Sin elementos para ordenar.</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ margin: '0 0 4px', fontSize: 13, color: t.muted }}>
        Usa las flechas para colocar los pasos en el orden correcto.
      </p>
      {items.map((item, i) => (
        <div
          key={item.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 14px',
            borderRadius: 14,
            border: `1.5px solid ${t.line}`,
            background: t.surface,
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background: accent.bg,
              color: accent.fg,
              fontWeight: 700,
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {i + 1}
          </span>
          <span style={{ flex: 1, fontSize: 15, color: t.ink, fontWeight: 500 }}>{item.text}</span>
          <div style={{ display: 'inline-flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => onMove(i, i - 1)}
              disabled={i === 0}
              aria-label="Subir"
              style={iconBtn(t, i === 0)}
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => onMove(i, i + 1)}
              disabled={i === items.length - 1}
              aria-label="Bajar"
              style={iconBtn(t, i === items.length - 1)}
            >
              ↓
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function pillStyle(t: ThemeArg, accent: AccentArg, selected: boolean): React.CSSProperties {
  void accent;
  return {
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
    width: '100%',
  };
}

function iconBtn(t: ThemeArg, disabled: boolean): React.CSSProperties {
  return {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: `1px solid ${t.line}`,
    background: disabled ? t.lineSoft : t.surface,
    color: disabled ? t.faint : t.ink,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700,
    fontSize: 16,
    lineHeight: '30px',
  };
}
