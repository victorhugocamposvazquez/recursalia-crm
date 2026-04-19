'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { InspiracionOracle } from '@/components/marketing/inspiracion/InspiracionOracle';
import {
  FROM_OPTIONS,
  GOAL_OPTIONS,
  WORLDS,
  type FromId,
  type GoalId,
  type WorldId,
} from '@/components/marketing/inspiracion/inspiracionCopy';
import styles from './InspiracionExperience.module.css';

const STORAGE_KEY = 'recursalia_inspiracion_flow_v2';

type FlowState = {
  step: number;
  name: string;
  worlds: WorldId[];
  fromId: FromId | null;
  goalId: GoalId | null;
};

const emptyFlow: FlowState = {
  step: 0,
  name: '',
  worlds: [],
  fromId: null,
  goalId: null,
};

function loadFlow(): FlowState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FlowState>;
      return {
        step: typeof parsed.step === 'number' ? parsed.step : 0,
        name: typeof parsed.name === 'string' ? parsed.name : '',
        worlds: Array.isArray(parsed.worlds) ? (parsed.worlds as WorldId[]) : [],
        fromId: (parsed.fromId as FromId) ?? null,
        goalId: (parsed.goalId as GoalId) ?? null,
      };
    }
    const legacy = sessionStorage.getItem('recursalia_inspiracion_nombre');
    if (legacy?.trim()) {
      return { ...emptyFlow, name: legacy.trim(), step: 1 };
    }
    return { ...emptyFlow };
  } catch {
    return { ...emptyFlow };
  }
}

function saveFlow(s: FlowState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function InspiracionExperience() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [flow, setFlow] = useState<FlowState>(emptyFlow);
  const [draftName, setDraftName] = useState('');

  useEffect(() => {
    setMounted(true);
    const s = loadFlow();
    setFlow(s);
    setDraftName(s.name);
  }, []);

  const persist = useCallback((next: FlowState) => {
    setFlow(next);
    saveFlow(next);
  }, []);

  const bumpOracle = useCallback(() => {
    setPulseKey((k) => k + 1);
  }, []);

  const filledSegments = useMemo(() => {
    if (flow.step === 0) return 0;
    if (flow.step >= 5) return 4;
    return flow.step;
  }, [flow.step]);

  function exit() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    router.push('/');
  }

  function goBack() {
    setFlow((prev) => {
      if (prev.step <= 0) return prev;
      setPulseKey((k) => k + 1);
      const next = { ...prev, step: prev.step - 1 };
      saveFlow(next);
      return next;
    });
  }

  function goIntro() {
    bumpOracle();
    persist({ ...flow, step: 1 });
  }

  function submitName() {
    const v = draftName.trim();
    if (!v) return;
    bumpOracle();
    persist({ ...flow, name: v, step: 2 });
  }

  function continueWorlds() {
    if (flow.worlds.length === 0) return;
    bumpOracle();
    persist({ ...flow, step: 3 });
  }

  function continueFrom() {
    if (!flow.fromId) return;
    bumpOracle();
    persist({ ...flow, step: 4 });
  }

  function continueGoal() {
    if (!flow.goalId) return;
    bumpOracle();
    persist({ ...flow, step: 5 });
  }

  function toggleWorld(id: WorldId) {
    setFlow((prev) => {
      const worlds = prev.worlds.includes(id)
        ? prev.worlds.filter((x) => x !== id)
        : [...prev.worlds, id];
      const next = { ...prev, worlds };
      saveFlow(next);
      return next;
    });
    bumpOracle();
  }

  function selectFrom(id: FromId) {
    setFlow((prev) => {
      const next = { ...prev, fromId: id };
      saveFlow(next);
      return next;
    });
    bumpOracle();
  }

  function selectGoal(id: GoalId) {
    setFlow((prev) => {
      const next = { ...prev, goalId: id };
      saveFlow(next);
      return next;
    });
    bumpOracle();
  }

  if (!mounted) {
    return (
      <div className={styles.shell}>
        <div className={styles.loading}>Cargando…</div>
      </div>
    );
  }

  const firstName = flow.name.trim().split(/\s+/)[0] || 'tú';

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => (flow.step <= 0 ? router.push('/') : goBack())}
          aria-label={flow.step <= 0 ? 'Volver al inicio' : 'Paso anterior'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className={styles.progress} aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${styles.progressSeg} ${i < filledSegments ? styles.progressSegOn : ''}`} />
          ))}
        </div>
        <button type="button" className={styles.exitBtn} onClick={exit}>
          Salir
        </button>
      </header>

      <InspiracionOracle pulseKey={pulseKey} />

      {flow.step === 0 ? (
        <>
          <div className={styles.introBrand}>
            <p className={styles.introBrandHi}>Hola, soy</p>
            <p className={styles.introBrandName}>Recursalia</p>
            <p className={styles.tagline}>Tu brújula de aprendizaje</p>
          </div>
          <h1 className={styles.headline}>
            Encuentro la <em>formación</em> perfecta para ti.
          </h1>
          <p className={styles.body}>
            Cuatro preguntas breves. Con ellas cruzo intereses, tiempo y punto de partida para orientarte
            hacia cursos que encajen — <em>a tu ritmo, a tu medida</em>.
          </p>
          <div className={styles.pills}>
            <span className={styles.pill}>
              <span className={styles.pillIcon}>✦</span> Catálogo vivo
            </span>
            <span className={styles.pill}>
              <span className={styles.pillIcon}>✦</span> Rutas sugeridas
            </span>
            <span className={styles.pill}>
              <span className={styles.pillIcon}>✦</span> Inspiración guiada
            </span>
          </div>
          <button type="button" className={styles.cta} onClick={goIntro}>
            Empezar ahora →
          </button>
          <p className={styles.ctaMicro}>4 preguntas · ~1 min · sin registro</p>
        </>
      ) : null}

      {flow.step === 1 ? (
        <>
          <p className={styles.stepMeta}>Paso 1 de 4</p>
          <h1 className={styles.headline}>
            Empecemos por lo <em>esencial</em>.
          </h1>
          <p className={styles.body}>
            Dime cómo te llamas y te hablaré por tu nombre en cada paso. Así esto deja de ser un cuestionario
            y empieza a ser una <strong>conversación</strong>.
          </p>
          <div className={styles.inputWrap}>
            <input
              className={styles.input}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Tu nombre"
              autoComplete="given-name"
              maxLength={80}
            />
          </div>
          <button
            type="button"
            className={styles.cta}
            disabled={!draftName.trim()}
            onClick={submitName}
          >
            Continuar →
          </button>
        </>
      ) : null}

      {flow.step === 2 ? (
        <>
          <p className={styles.stepMeta}>Paso 2 de 4</p>
          <h1 className={styles.headline}>
            {firstName}, ¿qué mundos te <em>despiertan</em>?
          </h1>
          <p className={styles.body}>
            Marca <strong>todos</strong> los territorios que te interesan. Cuantos más elijas, más caminos
            podremos cruzar para ti.
          </p>
          <div className={styles.chipCloud}>
            {WORLDS.map((w) => (
              <button
                key={w.id}
                type="button"
                className={`${styles.chip} ${flow.worlds.includes(w.id) ? styles.chipSelected : ''}`}
                onClick={() => toggleWorld(w.id)}
              >
                <span aria-hidden>{w.emoji}</span> {w.label}
              </button>
            ))}
          </div>
          <button type="button" className={styles.cta} disabled={flow.worlds.length === 0} onClick={continueWorlds}>
            Me lo guardo →
          </button>
        </>
      ) : null}

      {flow.step === 3 ? (
        <>
          <p className={styles.stepMeta}>Paso 3 de 4</p>
          <h1 className={styles.headline}>
            ¿De dónde <em>partimos</em>?
          </h1>
          <p className={styles.body}>Elige la opción que mejor describe tu punto de partida hoy.</p>
          <div className={styles.optionList}>
            {FROM_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`${styles.option} ${flow.fromId === o.id ? styles.optionSelected : ''}`}
                onClick={() => selectFrom(o.id)}
              >
                <span className={styles.optionEmoji} aria-hidden>
                  {o.emoji}
                </span>
                {o.label}
              </button>
            ))}
          </div>
          <button type="button" className={styles.cta} disabled={!flow.fromId} onClick={continueFrom}>
            Continuar →
          </button>
        </>
      ) : null}

      {flow.step === 4 ? (
        <>
          <p className={styles.stepMeta}>Último paso</p>
          <h1 className={styles.headline}>
            Y ahora, <em>¿hacia dónde?</em>
          </h1>
          <p className={styles.body}>Una sola dirección por ahora: priorizamos lo que más te urge.</p>
          <div className={styles.optionList}>
            {GOAL_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`${styles.option} ${flow.goalId === o.id ? styles.optionSelected : ''}`}
                onClick={() => selectGoal(o.id)}
              >
                <span className={styles.optionEmoji} aria-hidden>
                  {o.emoji}
                </span>
                {o.label}
              </button>
            ))}
          </div>
          <button type="button" className={styles.cta} disabled={!flow.goalId} onClick={continueGoal}>
            Ver mi formación →
          </button>
        </>
      ) : null}

      {flow.step === 5 ? (
        <>
          <p className={styles.kickerDone}>
            <span aria-hidden>✦</span> LISTO, {firstName.toUpperCase()}
          </p>
          <h1 className={styles.headline}>
            Tu <em>formación</em> está diseñada.
          </h1>
          <p className={styles.subResult}>
            Propuesta orientativa según tus {4} respuestas (pronto enlazada al catálogo real).
          </p>

          <article className={styles.cardPrimary}>
            <span className={`${styles.cardTag} ${styles.cardTagPrimary}`}>Mi recomendación · ruta</span>
            <h2 className={styles.cardTitle}>Growth digital aplicado</h2>
            <p className={styles.cardMeta}>4 cursos sugeridos · ritmo flexible · nivel intermedio</p>
            <div className={styles.stepsVisual}>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className={`${styles.stepBox} ${n === 1 ? styles.stepBoxFilled : ''}`}>
                  {n}
                </div>
              ))}
            </div>
            <div className={styles.cardFoot}>
              <span className={styles.priceLime}>Desde el catálogo →</span>
              <Link href="/cursos" className={styles.linkGhost}>
                Ver →
              </Link>
            </div>
          </article>

          <article className={styles.cardSecondary}>
            <span className={`${styles.cardTag} ${styles.cardTagSecondary}`}>Otra opción · ruta</span>
            <h2 className={styles.cardTitle}>Datos para negocio</h2>
            <p className={styles.cardMeta}>3 módulos · enfoque práctico · intermedio</p>
            <div className={styles.stepsVisual}>
              {[1, 2, 3].map((n) => (
                <div key={n} className={`${styles.stepBox} ${n === 1 ? styles.stepBoxFilled : ''}`}>
                  {n}
                </div>
              ))}
            </div>
            <div className={styles.cardFoot}>
              <span style={{ color: 'rgb(255 255 255 / 65%)' }}>Explorar similares</span>
              <Link href="/cursos?q=datos" className={styles.linkGhost}>
                Ver →
              </Link>
            </div>
          </article>

          <div className={styles.sectionMuted}>
            <p className={styles.sectionMutedTitle}>O si prefieres empezar ligero</p>
            <Link href="/cursos?q=marketing" className={styles.lightRow}>
              <div className={styles.lightAvatar} style={{ background: 'rgb(198 240 77 / 35%)' }}>
                MK
              </div>
              <div className={styles.lightBody}>
                <p className={styles.lightTitle}>Fundamentos de marketing digital</p>
                <p className={styles.lightMeta}>4.8 ★ · 12 h · entrada suave</p>
              </div>
            </Link>
            <Link href="/cursos?q=tecnología" className={styles.lightRow}>
              <div className={styles.lightAvatar} style={{ background: 'rgb(160 179 255 / 35%)' }}>
                AI
              </div>
              <div className={styles.lightBody}>
                <p className={styles.lightTitle}>Intro práctica a la IA aplicada</p>
                <p className={styles.lightMeta}>4.7 ★ · 8 h · proyecto corto</p>
              </div>
            </Link>
          </div>

          <button type="button" className={styles.cta} onClick={() => router.push('/cursos')}>
            Ir al catálogo →
          </button>
          <div className={styles.footerLinks}>
            <button
              type="button"
              className={styles.linkDim}
              onClick={() => {
                setPulseKey((k) => k + 1);
                const nameKeep = flow.name;
                setFlow((prev) => {
                  const next = {
                    ...prev,
                    step: 1,
                    worlds: [] as WorldId[],
                    fromId: null as FromId | null,
                    goalId: null as GoalId | null,
                  };
                  saveFlow(next);
                  return next;
                });
                setDraftName(nameKeep);
              }}
            >
              Refinar respuestas
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
