'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import styles from './quizzes.module.css';

export type ModuleSummary = {
  topicId: string;
  title: string;
  position: number;
  lessonsCount: number;
};

export type QuizSummaryAdmin = {
  id: string;
  topic_id: string | null;
  lesson_id: string | null;
  is_final: boolean;
  title: string;
  pass_threshold: number;
  module_position: number | null;
  question_count: number;
  created_at: string;
};

type GenerateBody = {
  scope: 'module' | 'final';
  topicId?: string;
  mode: 'ai' | 'manual';
  numQuestions?: number;
  title?: string;
  replace?: boolean;
};

type Feedback = { type: 'ok' | 'error'; text: string; id: string };

type BulkResult = {
  modulesCreated: number;
  modulesSkipped: number;
  modulesFailed: number;
  finalCreated: boolean;
  finalSkipped: boolean;
  finalFailed: boolean;
  notes: string[];
};

export function QuizzesAdminClient({
  courseId,
  courseTitle,
  coursePublicSlug,
  hasContent,
  hasExpanded,
  modules,
  quizzes,
  finalQuiz,
}: {
  courseId: string;
  courseTitle: string;
  coursePublicSlug: string | null;
  hasContent: boolean;
  hasExpanded: boolean;
  modules: ModuleSummary[];
  quizzes: QuizSummaryAdmin[];
  finalQuiz: QuizSummaryAdmin | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [moduleQuestions, setModuleQuestions] = useState<number>(6);
  const [finalQuestions, setFinalQuestions] = useState<number>(10);
  const [isPending, startTransition] = useTransition();

  // Bulk: generar todos los quizzes del curso de golpe.
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkOverwrite, setBulkOverwrite] = useState<boolean>(true);
  const [bulkFeedback, setBulkFeedback] = useState<
    { type: 'ok' | 'error'; text: string; result?: BulkResult } | null
  >(null);
  const [bulkModuleQuestions, setBulkModuleQuestions] = useState<number>(6);
  const [bulkFinalQuestions, setBulkFinalQuestions] = useState<number>(10);

  const anyBusy = busy !== null || bulkBusy || isPending;

  const quizByTopic = new Map<string, QuizSummaryAdmin>();
  for (const q of quizzes) {
    if (q.topic_id && !q.is_final) {
      quizByTopic.set(q.topic_id, q);
    }
  }

  async function generate(body: GenerateBody, opId: string) {
    setBusy(opId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; quizId?: string; questions?: number; error?: string }
        | null;
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? 'No se pudo completar la operación');
      }
      setFeedback({
        type: 'ok',
        id: opId,
        text: body.mode === 'ai'
          ? `Quiz generado con ${data.questions ?? '?'} preguntas`
          : 'Quiz creado vacío (añade preguntas con IA cuando estés listo)',
      });
      startTransition(() => router.refresh());
    } catch (e) {
      setFeedback({
        type: 'error',
        id: opId,
        text: e instanceof Error ? e.message : 'Error',
      });
    } finally {
      setBusy(null);
    }
  }

  async function removeQuiz(quizId: string, opId: string) {
    if (!window.confirm('¿Eliminar este quiz y todas sus preguntas?')) return;
    setBusy(opId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}`, { method: 'DELETE' });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? 'No se pudo eliminar');
      }
      setFeedback({ type: 'ok', id: opId, text: 'Quiz eliminado' });
      startTransition(() => router.refresh());
    } catch (e) {
      setFeedback({ type: 'error', id: opId, text: e instanceof Error ? e.message : 'Error' });
    } finally {
      setBusy(null);
    }
  }

  async function generateAll() {
    if (bulkBusy || !hasContent) return;
    const totalModules = Math.max(0, modules.length - 1);
    const willReplace = bulkOverwrite;
    const confirmMsg = willReplace
      ? `Vas a generar con IA ${totalModules} quizzes de módulo + 1 examen final. Las preguntas existentes se reemplazarán. ¿Continuar?`
      : `Vas a generar con IA los quizzes que aún no estén configurados (hasta ${totalModules} módulos + examen final). ¿Continuar?`;
    if (!window.confirm(confirmMsg)) return;

    setBulkBusy(true);
    setBulkFeedback(null);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/quizzes/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionsPerModule: bulkModuleQuestions,
          questionsForFinal: bulkFinalQuestions,
          force: bulkOverwrite,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; summary?: string; result?: BulkResult; error?: string }
        | null;
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? 'No se pudo completar la generación');
      }
      setBulkFeedback({
        type: 'ok',
        text: data.summary ?? 'Quizzes generados',
        result: data.result,
      });
      startTransition(() => router.refresh());
    } catch (e) {
      setBulkFeedback({
        type: 'error',
        text: e instanceof Error ? e.message : 'Error',
      });
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <Link href={`/dashboard/courses/${courseId}`} className={styles.back}>
            ← Volver al curso
          </Link>
          <h1 className={styles.title}>Quizzes · {courseTitle}</h1>
          <p className={styles.subtitle}>
            Crea quizzes por módulo y un examen final. Puedes generarlos con IA a partir del contenido
            existente o empezar con una plantilla vacía y editarlos manualmente.
          </p>
        </div>
        <div className={styles.headActions}>
          {coursePublicSlug ? (
            <Link href={`/aprender/cursos/${coursePublicSlug}`} target="_blank" className={styles.btnGhost}>
              Ver hub del alumno ↗
            </Link>
          ) : null}
        </div>
      </header>

      {!hasContent ? (
        <section className={styles.warn}>
          <h2 className={styles.warnTitle}>El curso aún no tiene estructura</h2>
          <p className={styles.warnText}>
            Antes de generar quizzes con IA necesitas haber generado la estructura del curso
            (módulos + lecciones) y, recomendado, el contenido extendido.
          </p>
        </section>
      ) : null}

      {hasContent && !hasExpanded ? (
        <section className={styles.notice}>
          <strong>Recomendado:</strong> genera primero el contenido extendido del curso para que la IA
          tenga material rico al elaborar las preguntas. Aún así puedes generarlos sin él.
        </section>
      ) : null}

      {hasContent ? (
        <section className={styles.bulkCard}>
          <div className={styles.bulkHead}>
            <span className={styles.bulkEyebrow}>Generación masiva con IA</span>
            <h2 className={styles.bulkTitle}>Generar todos los quizzes del curso</h2>
            <p className={styles.bulkLead}>
              En una sola pasada: {Math.max(0, modules.length - 1)} quiz{Math.max(0, modules.length - 1) === 1 ? '' : 'zes'} de módulo
              + el examen final (boss fight). Cada quiz se ancla a su módulo y el examen cubre todo el curso.
              Tarda entre 1 y 3 minutos.
            </p>
          </div>

          <div className={styles.bulkControls}>
            <label className={styles.bulkControlLabel}>
              Nº preguntas por módulo
              <input
                type="number"
                min={3}
                max={15}
                value={bulkModuleQuestions}
                onChange={(e) =>
                  setBulkModuleQuestions(Math.max(3, Math.min(15, Number(e.target.value) || 6)))
                }
                className={styles.bulkNumInput}
                disabled={bulkBusy}
              />
            </label>
            <label className={styles.bulkControlLabel}>
              Nº preguntas del examen final
              <input
                type="number"
                min={5}
                max={25}
                value={bulkFinalQuestions}
                onChange={(e) =>
                  setBulkFinalQuestions(Math.max(5, Math.min(25, Number(e.target.value) || 10)))
                }
                className={styles.bulkNumInput}
                disabled={bulkBusy}
              />
            </label>
            <label className={styles.bulkCheckLabel}>
              <input
                type="checkbox"
                checked={bulkOverwrite}
                onChange={(e) => setBulkOverwrite(e.target.checked)}
                disabled={bulkBusy}
              />
              Sobrescribir quizzes ya configurados
            </label>
          </div>

          <div className={styles.bulkActions}>
            <button
              type="button"
              className={styles.bulkBtn}
              onClick={generateAll}
              disabled={bulkBusy || !hasContent}
            >
              {bulkBusy ? (
                <>
                  <span className={styles.spinner} aria-hidden />
                  Generando con IA… 1–3 min
                </>
              ) : (
                <>Generar todos los quizzes con IA</>
              )}
            </button>
            {bulkBusy ? (
              <p className={styles.bulkHint}>
                No cierres esta pestaña hasta que termine. Los quizzes se irán guardando en el orden de los módulos.
              </p>
            ) : null}
          </div>

          {bulkFeedback ? (
            <p className={bulkFeedback.type === 'ok' ? styles.bulkFbOk : styles.bulkFbError}>
              {bulkFeedback.text}
              {bulkFeedback.result && bulkFeedback.result.notes.length > 0 ? (
                <>
                  <br />
                  <small>{bulkFeedback.result.notes.join(' · ')}</small>
                </>
              ) : null}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className={styles.section}>
        <header className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Quizzes por módulo</h2>
          <div className={styles.controlsInline}>
            <label className={styles.controlLabel}>
              Nº preguntas
              <input
                type="number"
                min={3}
                max={15}
                value={moduleQuestions}
                onChange={(e) => setModuleQuestions(Math.max(3, Math.min(15, Number(e.target.value) || 6)))}
                className={styles.numInput}
              />
            </label>
          </div>
        </header>

        {modules.length === 0 ? (
          <p className={styles.empty}>Este curso aún no tiene módulos.</p>
        ) : (
          <div className={styles.list}>
            {modules.map((m) => {
              const q = quizByTopic.get(m.topicId) ?? null;
              const opIdGen = `mod-gen-${m.topicId}`;
              const opIdManual = `mod-man-${m.topicId}`;
              const opIdDel = `mod-del-${m.topicId}`;
              const itemBusy =
                busy === opIdGen ||
                busy === opIdManual ||
                busy === opIdDel ||
                isPending ||
                bulkBusy;
              return (
                <article key={m.topicId} className={styles.row}>
                  <div className={styles.rowMain}>
                    <div className={styles.rowHead}>
                      <span className={styles.rowEyebrow}>
                        Módulo {String(m.position + 1).padStart(2, '0')} · {m.lessonsCount} lecciones
                      </span>
                      <h3 className={styles.rowTitle}>{m.title}</h3>
                    </div>
                    {q ? (
                      <div className={styles.rowStatus}>
                        <span className={styles.badgeOk}>Configurado</span>
                        <span className={styles.metaText}>
                          {q.question_count} preguntas · Aprobado ≥ {Math.round(q.pass_threshold * 100)}%
                        </span>
                      </div>
                    ) : (
                      <div className={styles.rowStatus}>
                        <span className={styles.badgeWarn}>Sin quiz</span>
                        <span className={styles.metaText}>Genera con IA o crea vacío</span>
                      </div>
                    )}
                    {feedback && (feedback.id === opIdGen || feedback.id === opIdManual || feedback.id === opIdDel) ? (
                      <p className={feedback.type === 'ok' ? styles.fbOk : styles.fbError}>{feedback.text}</p>
                    ) : null}
                  </div>
                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      disabled={itemBusy || !hasContent}
                      onClick={() =>
                        generate(
                          {
                            scope: 'module',
                            topicId: m.topicId,
                            mode: 'ai',
                            numQuestions: moduleQuestions,
                            replace: true,
                          },
                          opIdGen
                        )
                      }
                    >
                      {busy === opIdGen ? 'Generando…' : q ? 'Regenerar con IA' : 'Generar con IA'}
                    </button>
                    {!q ? (
                      <button
                        type="button"
                        className={styles.btnGhost}
                        disabled={itemBusy || !hasContent}
                        onClick={() =>
                          generate(
                            { scope: 'module', topicId: m.topicId, mode: 'manual' },
                            opIdManual
                          )
                        }
                      >
                        {busy === opIdManual ? 'Creando…' : 'Crear vacío (manual)'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.btnDanger}
                        disabled={itemBusy}
                        onClick={() => removeQuiz(q.id, opIdDel)}
                      >
                        {busy === opIdDel ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Examen final (boss fight)</h2>
          <div className={styles.controlsInline}>
            <label className={styles.controlLabel}>
              Nº preguntas
              <input
                type="number"
                min={5}
                max={25}
                value={finalQuestions}
                onChange={(e) => setFinalQuestions(Math.max(5, Math.min(25, Number(e.target.value) || 10)))}
                className={styles.numInput}
              />
            </label>
          </div>
        </header>
        <article className={styles.row}>
          <div className={styles.rowMain}>
            <div className={styles.rowHead}>
              <span className={styles.rowEyebrow}>Examen final · cubre todo el curso</span>
              <h3 className={styles.rowTitle}>{finalQuiz?.title ?? 'Examen final del curso'}</h3>
            </div>
            {finalQuiz ? (
              <div className={styles.rowStatus}>
                <span className={styles.badgeOk}>Configurado</span>
                <span className={styles.metaText}>
                  {finalQuiz.question_count} preguntas · Aprobado ≥ {Math.round(finalQuiz.pass_threshold * 100)}%
                </span>
              </div>
            ) : (
              <div className={styles.rowStatus}>
                <span className={styles.badgeWarn}>Sin examen final</span>
                <span className={styles.metaText}>Hasta que no exista, los alumnos no podrán recibir diploma</span>
              </div>
            )}
            {feedback && (feedback.id === 'final-gen' || feedback.id === 'final-man' || feedback.id === 'final-del') ? (
              <p className={feedback.type === 'ok' ? styles.fbOk : styles.fbError}>{feedback.text}</p>
            ) : null}
          </div>
          <div className={styles.rowActions}>
            <button
              type="button"
              className={styles.btnPrimary}
              disabled={anyBusy || !hasContent}
              onClick={() =>
                generate(
                  { scope: 'final', mode: 'ai', numQuestions: finalQuestions, replace: true },
                  'final-gen'
                )
              }
            >
              {busy === 'final-gen' ? 'Generando…' : finalQuiz ? 'Regenerar con IA' : 'Generar con IA'}
            </button>
            {!finalQuiz ? (
              <button
                type="button"
                className={styles.btnGhost}
                disabled={anyBusy || !hasContent}
                onClick={() => generate({ scope: 'final', mode: 'manual' }, 'final-man')}
              >
                {busy === 'final-man' ? 'Creando…' : 'Crear vacío (manual)'}
              </button>
            ) : (
              <button
                type="button"
                className={styles.btnDanger}
                disabled={anyBusy}
                onClick={() => removeQuiz(finalQuiz.id, 'final-del')}
              >
                {busy === 'final-del' ? 'Eliminando…' : 'Eliminar'}
              </button>
            )}
          </div>
        </article>
      </section>

      <section className={styles.helpBox}>
        <h3 className={styles.helpTitle}>Cómo funciona</h3>
        <ul className={styles.helpList}>
          <li>
            <strong>Generar con IA:</strong> el modelo crea preguntas variadas (opción única, verdadero/falso,
            selección múltiple y ordenar pasos) a partir del título, lecciones y contenido extendido del módulo.
            Si vuelves a generar, las preguntas anteriores se reemplazan.
          </li>
          <li>
            <strong>Crear vacío (manual):</strong> deja preparado el quiz para que añadas preguntas a mano
            desde Supabase mientras llega un editor visual completo.
          </li>
          <li>
            <strong>Examen final:</strong> sirve como «boss fight» del curso. Si el alumno lo aprueba (≥70%),
            se le emite un diploma automáticamente.
          </li>
          <li>
            Las preguntas de tipo <em>image</em> (elegir entre imágenes) no se generan por IA: requieren
            assets y se añaden manualmente cuando estén disponibles.
          </li>
        </ul>
      </section>
    </div>
  );
}
