'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const BRAND = '#1b38c4';
const GREEN = 'rgb(42, 215, 69)';
const RED = '#ef4444';
const GOLD = '#fbbf24';

const TIMER_SECONDS = 25; // por pregunta
const SPEED_BONUS_THRESHOLD = 10; // s: si respondes antes, bonus
const BASE_XP_PER_CORRECT = 10;
const SPEED_BONUS_XP = 5;
const STARTING_HEARTS = 5;

type Verdict = 'correct' | 'wrong' | null;

interface QuestionResult {
  questionId: string;
  given: unknown;
  correct: boolean;
  timeSpentMs: number;
}

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

  // ── Gamificación ─────────────────────────────────────────────
  const [hearts, setHearts] = useState(STARTING_HEARTS);
  const [combo, setCombo] = useState(0); // racha de aciertos seguidos
  const [maxCombo, setMaxCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [showExplain, setShowExplain] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [paused, setPaused] = useState(false); // mientras se muestra feedback
  const questionStartRef = useRef<number>(Date.now());

  const q = questions[index];
  const total = questions.length;
  const progress = total ? (index + 1) / total : 0;

  const payload = useMemo(() => {
    if (!q) return {} as Record<string, unknown>;
    return (q.payload ?? {}) as Record<string, unknown>;
  }, [q]);

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

  // Reinicia el timer al cambiar de pregunta
  useEffect(() => {
    setVerdict(null);
    setShowExplain(false);
    setSecondsLeft(TIMER_SECONDS);
    setPaused(false);
    questionStartRef.current = Date.now();
  }, [index]);

  // Tick del cronómetro (solo cuando no estamos pausados mostrando feedback)
  useEffect(() => {
    if (paused || verdict !== null) return;
    if (!q) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          // Tiempo agotado → marcar como fallo automático
          handleTimeout();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused, verdict, q?.id]);

  // ── Submit ─────────────────────────────────────────────────────
  async function submitToServer(finalResults: QuestionResult[]) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const body = {
        courseId,
        answers: questions.map((question) => {
          const r = finalResults.find((rr) => rr.questionId === question.id);
          return {
            questionId: question.id,
            given: r?.given ?? answers[question.id] ?? null,
          };
        }),
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
    if (!q || verdict !== null) return;
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  }

  function toggleMulti(optionId: string) {
    if (!q || verdict !== null) return;
    const current = (answers[q.id] as string[] | undefined) ?? [];
    const next = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];
    setAnswer(next);
  }

  function reorder(from: number, to: number) {
    if (verdict !== null) return;
    if (to < 0 || to >= orderItems.length) return;
    const copy = [...orderItems];
    const [item] = copy.splice(from, 1);
    if (!item) return;
    copy.splice(to, 0, item);
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q.id]: copy.map((o) => o.id) }));
  }

  // Calcula la corrección de la pregunta actual en cliente
  function isCorrect(): boolean {
    if (!q) return false;
    const given = answers[q.id];
    if (q.kind === 'tf') {
      return given === payload.correct;
    }
    if (q.kind === 'single' || q.kind === 'image') {
      return given === payload.correct;
    }
    if (q.kind === 'multi') {
      const correctArr = (payload.correct as string[] | undefined) ?? [];
      const givenArr = (given as string[] | undefined) ?? [];
      if (givenArr.length !== correctArr.length) return false;
      const setC = new Set(correctArr);
      return givenArr.every((id) => setC.has(id));
    }
    if (q.kind === 'order') {
      const correctOrder = (payload.correct_order as string[] | undefined) ?? [];
      const givenArr = (given as string[] | undefined) ?? orderItems.map((o) => o.id);
      if (givenArr.length !== correctOrder.length) return false;
      return givenArr.every((id, i) => id === correctOrder[i]);
    }
    return false;
  }

  function isAnswered(): boolean {
    if (!q) return false;
    const v = answers[q.id];
    if (q.kind === 'multi') return Array.isArray(v) && v.length > 0;
    if (q.kind === 'order') return true;
    return v !== undefined && v !== null;
  }

  function handleCheck() {
    if (!q || verdict !== null) return;
    if (!isAnswered()) return;
    const timeSpentMs = Date.now() - questionStartRef.current;
    const correct = isCorrect();
    const v: Verdict = correct ? 'correct' : 'wrong';
    setVerdict(v);
    setShowExplain(true);
    setPaused(true);

    setResults((prev) => [
      ...prev,
      {
        questionId: q.id,
        given: answers[q.id] ?? null,
        correct,
        timeSpentMs,
      },
    ]);

    if (correct) {
      const wasFast = timeSpentMs <= SPEED_BONUS_THRESHOLD * 1000;
      const newCombo = combo + 1;
      const multiplier = Math.min(3, 1 + Math.floor(newCombo / 3)); // x1, x2 a partir de 3, x3 a partir de 6
      const earned = BASE_XP_PER_CORRECT * multiplier + (wasFast ? SPEED_BONUS_XP : 0);
      setCombo(newCombo);
      setMaxCombo((m) => Math.max(m, newCombo));
      setXp((x) => x + earned);
    } else {
      setHearts((h) => Math.max(0, h - 1));
      setCombo(0);
    }
  }

  function handleTimeout() {
    if (!q || verdict !== null) return;
    setVerdict('wrong');
    setShowExplain(true);
    setPaused(true);
    setHearts((h) => Math.max(0, h - 1));
    setCombo(0);
    setResults((prev) => [
      ...prev,
      {
        questionId: q.id,
        given: answers[q.id] ?? null,
        correct: false,
        timeSpentMs: TIMER_SECONDS * 1000,
      },
    ]);
  }

  function handleAdvance() {
    if (hearts === 0) {
      // Game over: enviamos lo que hay con los fallos contados
      void submitToServer(results);
      return;
    }
    if (index < total - 1) {
      setIndex((i) => i + 1);
    } else {
      void submitToServer(results);
    }
  }

  // ── No questions ───────────────────────────────────────────────
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

  // ── Game over (sin vidas) ──────────────────────────────────────
  if (hearts === 0 && verdict !== null) {
    return (
      <GameOver
        t={t}
        isFinal={Boolean(isFinal)}
        onRetry={() => {
          // reset cliente
          setIndex(0);
          setAnswers({});
          setResults([]);
          setHearts(STARTING_HEARTS);
          setCombo(0);
          setMaxCombo(0);
          setXp(0);
          setVerdict(null);
          setShowExplain(false);
          setSecondsLeft(TIMER_SECONDS);
          setPaused(false);
          questionStartRef.current = Date.now();
        }}
        onExit={() => router.push(backHref)}
        title={title}
      />
    );
  }

  const isLast = index === total - 1;
  const timerPct = Math.max(0, Math.min(1, secondsLeft / TIMER_SECONDS));
  const timerColor = secondsLeft <= 5 ? RED : secondsLeft <= 10 ? GOLD : BRAND;
  const boss = Boolean(isFinal);

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: boss
          ? 'radial-gradient(ellipse at 20% 0%, rgba(251, 191, 36, 0.18), transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(239, 68, 68, 0.14), transparent 60%), ' + t.bg
          : t.bg,
        color: t.ink,
        fontFamily: t.sans,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* HUD superior: hearts + combo + xp + boss-tag */}
      <header
        style={{
          padding: '14px 20px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          borderBottom: `1px solid ${t.line}`,
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'saturate(160%) blur(10px)',
          WebkitBackdropFilter: 'saturate(160%) blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <Hearts t={t} count={hearts} />
        <Combo t={t} combo={combo} />
        <XpDisplay t={t} xp={xp} />
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ height: 6, background: t.lineSoft, borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress * 100}%`,
                background: `linear-gradient(90deg, ${BRAND}, ${GREEN})`,
                transition: 'width .25s ease',
                borderRadius: 3,
              }}
            />
          </div>
        </div>
        <Mono color={t.muted} size={12}>
          {index + 1}/{total}
        </Mono>
        {boss ? (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              background: `linear-gradient(135deg, ${GOLD}, #f97316)`,
              color: '#1a0d00',
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              fontFamily: t.mono,
              boxShadow: '0 6px 18px -8px rgba(251,191,36,0.7)',
            }}
          >
            Boss Fight
          </span>
        ) : (
          <Mono color={t.faint}>QUIZ</Mono>
        )}
      </header>

      {/* Timer bar fina bajo el HUD */}
      <div style={{ height: 3, background: t.lineSoft, position: 'sticky', top: 0, zIndex: 25 }}>
        <div
          style={{
            height: '100%',
            width: `${timerPct * 100}%`,
            background: timerColor,
            transition: 'width 1s linear, background-color .3s',
          }}
        />
      </div>

      <main
        style={{
          flex: 1,
          padding: '28px 20px 24px',
          maxWidth: 720,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Mono color={t.faint}>{kindLabel(q.kind)}</Mono>
          <span style={{ color: t.faint, fontSize: 11 }}>·</span>
          <Mono color={secondsLeft <= 5 ? RED : t.faint} size={11}>
            {secondsLeft}s
          </Mono>
        </div>
        <h2
          style={{
            margin: '0 0 24px',
            fontFamily: t.sans,
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: -0.5,
            lineHeight: 1.25,
          }}
        >
          {q.text}
        </h2>

        {q.kind === 'tf' ? (
          <TrueFalse
            t={t}
            accent={accent}
            value={answers[q.id]}
            verdict={verdict}
            correctValue={payload.correct as boolean}
            onChange={setAnswer}
          />
        ) : null}

        {q.kind === 'single' ? (
          <SingleChoice
            t={t}
            accent={accent}
            options={(payload.options as TextOption[]) ?? []}
            value={answers[q.id] as string | undefined}
            verdict={verdict}
            correctId={payload.correct as string}
            onChange={setAnswer}
          />
        ) : null}

        {q.kind === 'multi' ? (
          <MultiChoice
            t={t}
            accent={accent}
            options={(payload.options as TextOption[]) ?? []}
            value={(answers[q.id] as string[] | undefined) ?? []}
            verdict={verdict}
            correctIds={(payload.correct as string[]) ?? []}
            onToggle={toggleMulti}
          />
        ) : null}

        {q.kind === 'image' ? (
          <ImageChoice
            t={t}
            accent={accent}
            options={(payload.options as ImageOption[]) ?? []}
            value={answers[q.id] as string | undefined}
            verdict={verdict}
            correctId={payload.correct as string}
            onChange={setAnswer}
          />
        ) : null}

        {q.kind === 'order' ? (
          <OrderList
            t={t}
            accent={accent}
            items={orderItems}
            verdict={verdict}
            correctOrder={(payload.correct_order as string[]) ?? []}
            onReorder={reorder}
          />
        ) : null}

        {q.hint && verdict === null ? (
          <p style={{ marginTop: 20, fontSize: 13, color: t.muted, lineHeight: 1.5 }}>
            💡 Pista: {q.hint}
          </p>
        ) : null}
      </main>

      {/* Drawer de feedback */}
      {showExplain ? (
        <FeedbackDrawer
          t={t}
          verdict={verdict}
          explanation={q.explanation ?? null}
          isLast={isLast}
          onAdvance={handleAdvance}
          submitting={submitting}
        />
      ) : (
        <footer
          style={{
            padding: '14px 20px calc(20px + env(safe-area-inset-bottom, 0px))',
            borderTop: `1px solid ${t.line}`,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            background: t.surface,
            position: 'sticky',
            bottom: 0,
          }}
        >
          <Button
            kind="ghost"
            onClick={() => router.push(backHref)}
            style={{ color: t.muted, borderColor: t.line }}
          >
            Salir
          </Button>
          <Button
            bg={BRAND}
            fg="#ffffff"
            iconRight={isLast ? 'check' : 'arrowR'}
            onClick={handleCheck}
            disabled={!isAnswered() || submitting}
            style={{ minWidth: 160, justifyContent: 'center' }}
          >
            Comprobar
          </Button>
        </footer>
      )}
    </div>
  );
}

// ── Componentes ────────────────────────────────────────────────────────────

type ThemeArg = ReturnType<typeof useTheme>;
type AccentArg = { bg: string; fg: string };

function Hearts({ t, count }: { t: ThemeArg; count: number }) {
  void t;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }} aria-label={`${count} vidas`}>
      {Array.from({ length: STARTING_HEARTS }).map((_, i) => {
        const alive = i < count;
        return (
          <svg
            key={i}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={alive ? RED : 'transparent'}
            style={{
              transition: 'transform .2s, fill .2s',
              transform: alive ? 'scale(1)' : 'scale(0.85)',
            }}
            aria-hidden
          >
            <path
              d="M12 21s-7-4.5-7-10a4.5 4.5 0 018-2.8A4.5 4.5 0 0119 11c0 5.5-7 10-7 10z"
              stroke={alive ? RED : 'rgba(15,23,42,0.35)'}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </div>
  );
}

function Combo({ t, combo }: { t: ThemeArg; combo: number }) {
  if (combo < 2) return null;
  const multiplier = Math.min(3, 1 + Math.floor(combo / 3));
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 9px',
        borderRadius: 999,
        background: `linear-gradient(135deg, ${GOLD}, #f97316)`,
        color: '#1a0d00',
        fontSize: 11,
        fontWeight: 800,
        fontFamily: t.mono,
        letterSpacing: 0.2,
        animation: 'rx-pulse 1.4s ease-in-out infinite',
        boxShadow: '0 4px 14px -6px rgba(251,191,36,0.6)',
      }}
      aria-label={`Combo ${combo}, multiplicador ${multiplier}`}
    >
      🔥 {combo} {multiplier > 1 ? `· x${multiplier}` : ''}
    </div>
  );
}

function XpDisplay({ t, xp }: { t: ThemeArg; xp: number }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 9px',
        borderRadius: 999,
        background: 'rgba(27,56,196,0.10)',
        color: BRAND,
        fontSize: 11,
        fontWeight: 800,
        fontFamily: t.mono,
        letterSpacing: 0.4,
      }}
      aria-label={`${xp} XP`}
    >
      ⚡ {xp} XP
    </div>
  );
}

function FeedbackDrawer({
  t,
  verdict,
  explanation,
  isLast,
  onAdvance,
  submitting,
}: {
  t: ThemeArg;
  verdict: Verdict;
  explanation: string | null;
  isLast: boolean;
  onAdvance: () => void;
  submitting: boolean;
}) {
  const isCorrect = verdict === 'correct';
  const bg = isCorrect ? 'rgba(42, 215, 69, 0.16)' : 'rgba(239, 68, 68, 0.14)';
  const accentColor = isCorrect ? GREEN : RED;
  const headline = isCorrect ? '¡Correcto!' : 'Casi… era otra';
  const emoji = isCorrect ? '✅' : '💔';

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: bg,
        borderTop: `2px solid ${accentColor}`,
        padding: '18px 20px calc(20px + env(safe-area-inset-bottom, 0px))',
        position: 'sticky',
        bottom: 0,
        animation: 'rx-slide-up .25s ease-out',
        zIndex: 35,
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>{emoji}</span>
          <strong style={{ fontSize: 18, color: accentColor, letterSpacing: -0.2 }}>{headline}</strong>
        </div>
        {explanation ? (
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: t.ink }}>{explanation}</p>
        ) : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            bg={accentColor}
            fg="#ffffff"
            iconRight={isLast ? 'check' : 'arrowR'}
            onClick={onAdvance}
            disabled={submitting}
            style={{ minWidth: 170, justifyContent: 'center' }}
          >
            {submitting ? 'Guardando…' : isLast ? 'Ver resultado' : 'Siguiente'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function GameOver({
  t,
  isFinal,
  onRetry,
  onExit,
  title,
}: {
  t: ThemeArg;
  isFinal: boolean;
  onRetry: () => void;
  onExit: () => void;
  title: string;
}) {
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
          maxWidth: 460,
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
            width: 76,
            height: 76,
            borderRadius: 38,
            margin: '0 auto 20px',
            background: 'rgba(239, 68, 68, 0.15)',
            color: RED,
            display: 'grid',
            placeItems: 'center',
            fontSize: 36,
          }}
        >
          💔
        </div>
        <Mono color={t.faint}>SIN VIDAS</Mono>
        <h1 style={{ margin: '8px 0 12px', fontSize: 26, fontWeight: 800, letterSpacing: -0.6 }}>
          {isFinal ? '¡Casi! El boss no se rinde aún' : 'Necesitas otro intento'}
        </h1>
        <p style={{ margin: '0 0 22px', color: t.muted, lineHeight: 1.55 }}>
          Has perdido las 5 vidas en <strong>{title}</strong>. Revisa el material y vuelve a la carga — esta vez te lo sabes.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button
            bg={BRAND}
            fg="#ffffff"
            icon="bolt"
            onClick={onRetry}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Reintentar
          </Button>
          <Button
            kind="ghost"
            onClick={onExit}
            style={{ width: '100%', justifyContent: 'center', borderColor: t.line, color: t.ink }}
          >
            Volver al curso
          </Button>
        </div>
      </div>
    </div>
  );
}

function kindLabel(kind: QuizQuestionRecord['kind']): string {
  switch (kind) {
    case 'tf':
      return 'V / F';
    case 'single':
      return 'OPCIÓN ÚNICA';
    case 'multi':
      return 'SELECCIÓN MÚLTIPLE';
    case 'image':
      return 'VISUAL';
    case 'order':
      return 'ORDENA';
    default:
      return 'PREGUNTA';
  }
}

// ── Subcomponentes de respuesta ────────────────────────────────────────────

function TrueFalse({
  t,
  accent,
  value,
  verdict,
  correctValue,
  onChange,
}: {
  t: ThemeArg;
  accent: AccentArg;
  value: unknown;
  verdict: Verdict;
  correctValue: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[
        { label: 'Verdadero', value: true },
        { label: 'Falso', value: false },
      ].map((opt) => {
        const selected = value === opt.value;
        const state = stateForOption(verdict, selected, opt.value === correctValue);
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            disabled={verdict !== null}
            style={pillStyle(t, accent, selected, state)}
          >
            <span>{opt.label}</span>
            {state.iconRight ? <span style={{ marginLeft: 'auto' }}>{state.iconRight}</span> : null}
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
  verdict,
  correctId,
  onChange,
}: {
  t: ThemeArg;
  accent: AccentArg;
  options: TextOption[];
  value: string | undefined;
  verdict: Verdict;
  correctId: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {options.map((opt) => {
        const selected = value === opt.id;
        const state = stateForOption(verdict, selected, opt.id === correctId);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            disabled={verdict !== null}
            style={pillStyle(t, accent, selected, state)}
          >
            <span>{opt.text}</span>
            {state.iconRight ? <span style={{ marginLeft: 'auto' }}>{state.iconRight}</span> : null}
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
  verdict,
  correctIds,
  onToggle,
}: {
  t: ThemeArg;
  accent: AccentArg;
  options: TextOption[];
  value: string[];
  verdict: Verdict;
  correctIds: string[];
  onToggle: (id: string) => void;
}) {
  const correctSet = new Set(correctIds);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ margin: '0 0 4px', fontSize: 13, color: t.muted }}>
        Selecciona todas las opciones correctas.
      </p>
      {options.map((opt) => {
        const selected = value.includes(opt.id);
        const isCorrect = correctSet.has(opt.id);
        const state = stateForOption(verdict, selected, isCorrect);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            disabled={verdict !== null}
            style={{
              ...pillStyle(t, accent, selected, state),
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
                border: `2px solid ${selected ? state.borderColor ?? accent.bg : t.line}`,
                background: selected ? state.borderColor ?? accent.bg : 'transparent',
                color: '#fff',
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
            <span style={{ flex: 1, textAlign: 'left' }}>{opt.text}</span>
            {state.iconRight ?? null}
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
  verdict,
  correctId,
  onChange,
}: {
  t: ThemeArg;
  accent: AccentArg;
  options: ImageOption[];
  value: string | undefined;
  verdict: Verdict;
  correctId: string;
  onChange: (v: string) => void;
}) {
  void accent;
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
        const state = stateForOption(verdict, selected, opt.id === correctId);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            disabled={verdict !== null}
            style={{
              position: 'relative',
              borderRadius: 14,
              overflow: 'hidden',
              border: `2px solid ${state.borderColor ?? (selected ? BRAND : t.line)}`,
              background: t.surface,
              cursor: verdict !== null ? 'default' : 'pointer',
              padding: 0,
              transform: selected ? 'translateY(-2px)' : 'none',
              boxShadow: selected ? `0 12px 30px -16px ${state.borderColor ?? BRAND}80` : 'none',
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
  verdict,
  correctOrder,
  onReorder,
}: {
  t: ThemeArg;
  accent: AccentArg;
  items: TextOption[];
  verdict: Verdict;
  correctOrder: string[];
  onReorder: (from: number, to: number) => void;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  if (!items.length) {
    return <p style={{ color: t.muted }}>Sin elementos para ordenar.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ margin: '0 0 4px', fontSize: 13, color: t.muted }}>
        Arrastra para colocar los pasos en el orden correcto (o usa ↑/↓).
      </p>
      {items.map((item, i) => {
        const isInCorrectPosition = verdict !== null && correctOrder[i] === item.id;
        const showFeedback = verdict !== null;
        const correctPosColor = showFeedback ? (isInCorrectPosition ? GREEN : RED) : null;
        return (
          <div
            key={item.id}
            draggable={verdict === null}
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => {
              if (verdict !== null) return;
              e.preventDefault();
            }}
            onDrop={() => {
              if (verdict !== null) return;
              if (dragIdx === null || dragIdx === i) return;
              onReorder(dragIdx, i);
              setDragIdx(null);
            }}
            onDragEnd={() => setDragIdx(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 14px',
              borderRadius: 14,
              border: `1.5px solid ${correctPosColor ?? (dragIdx === i ? BRAND : t.line)}`,
              background: t.surface,
              cursor: verdict === null ? 'grab' : 'default',
              opacity: dragIdx === i ? 0.6 : 1,
              transition: 'border-color .15s, opacity .15s',
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                background: correctPosColor ?? accent.bg,
                color: '#fff',
                fontWeight: 800,
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
            {verdict === null ? (
              <div style={{ display: 'inline-flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => onReorder(i, i - 1)}
                  disabled={i === 0}
                  aria-label="Subir"
                  style={iconBtn(t, i === 0)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onReorder(i, i + 1)}
                  disabled={i === items.length - 1}
                  aria-label="Bajar"
                  style={iconBtn(t, i === items.length - 1)}
                >
                  ↓
                </button>
              </div>
            ) : (
              <span style={{ fontSize: 18 }}>{isInCorrectPosition ? '✓' : '✗'}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function stateForOption(
  verdict: Verdict,
  selected: boolean,
  isCorrect: boolean
): {
  borderColor?: string;
  bg?: string;
  iconRight?: React.ReactNode;
} {
  if (verdict === null) return {};
  if (isCorrect) {
    return {
      borderColor: GREEN,
      bg: 'rgba(42, 215, 69, 0.10)',
      iconRight: <span style={{ color: GREEN, fontSize: 18 }}>✓</span>,
    };
  }
  if (selected && !isCorrect) {
    return {
      borderColor: RED,
      bg: 'rgba(239, 68, 68, 0.08)',
      iconRight: <span style={{ color: RED, fontSize: 18 }}>✗</span>,
    };
  }
  return { borderColor: 'rgba(15,23,42,0.10)' };
}

function pillStyle(
  t: ThemeArg,
  accent: AccentArg,
  selected: boolean,
  state: ReturnType<typeof stateForOption>
): React.CSSProperties {
  void accent;
  const border = state.borderColor ?? (selected ? BRAND : 'rgba(15,23,42,0.12)');
  return {
    padding: '14px 18px',
    borderRadius: 14,
    border: selected ? `2px solid ${border}` : `1.5px solid ${border}`,
    background: state.bg ?? (selected ? 'rgba(27,56,196,0.06)' : t.surface),
    textAlign: 'left',
    fontSize: 15.5,
    fontWeight: selected ? 600 : 500,
    cursor: 'pointer',
    color: t.ink,
    fontFamily: 'inherit',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    transition: 'border-color .15s, background .15s',
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
