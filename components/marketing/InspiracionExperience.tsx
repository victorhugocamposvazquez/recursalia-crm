'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './InspiracionExperience.module.css';

const STORAGE_KEY = 'recursalia_inspiracion_nombre';

const AFICIONES = [
  'Tecnología',
  'Negocio',
  'Salud',
  'Creatividad',
  'Idiomas',
  'Bienestar',
  'Datos',
  'Liderazgo',
];

const DISPONIBILIDAD = [
  'Menos de 2 h/semana',
  '2–5 h/semana',
  '5–10 h/semana',
  'Más de 10 h/semana',
];

const FORMACION = [
  'Estoy empezando',
  'Nivel intermedio',
  'Quiero especializarme',
  'Actualización profesional',
];

export function InspiracionExperience() {
  const [name, setName] = useState('');
  const [draft, setDraft] = useState('');
  const [mounted, setMounted] = useState(false);
  const [aficiones, setAficiones] = useState<string[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<string | null>(null);
  const [formacion, setFormacion] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved?.trim()) {
        setName(saved.trim());
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persistName = useCallback((value: string) => {
    const v = value.trim();
    setName(v);
    try {
      if (v) {
        sessionStorage.setItem(STORAGE_KEY, v);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function onSubmitName(e: React.FormEvent) {
    e.preventDefault();
    const v = draft.trim();
    if (!v) return;
    persistName(v);
    setDraft('');
  }

  function toggleAficion(a: string) {
    setAficiones((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  function resetJourney() {
    persistName('');
    setAficiones([]);
    setDisponibilidad(null);
    setFormacion(null);
    setDraft('');
  }

  if (!mounted) {
    return (
      <div className={styles.page}>
        <div className={styles.intro}>
          <h1>Inspiración</h1>
          <p>Cargando…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {name ? (
        <div className={styles.personalBar} role="status">
          Hola, <em>{name}</em>. Te guiamos paso a paso.
        </div>
      ) : null}

      <div className={styles.intro}>
        <h1>Inspiración</h1>
        <p>
          Un recorrido gamificado para recomendarte cursos según tus gustos, tiempo disponible y punto
          de partida. Primero nos gustaría saber cómo llamarte; luego afinamos juntos tu perfil.
        </p>
      </div>

      {!name ? (
        <div className={styles.card}>
          <p className={styles.cardTitle}>Empecemos por ti</p>
          <p className={styles.cardHint}>
            Usaremos tu nombre en toda la experiencia para dirigirnos a ti con naturalidad.
          </p>
          <form className={styles.nameForm} onSubmit={onSubmitName}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="inspiracion-nombre">
                ¿Cómo te llamas?
              </label>
              <input
                id="inspiracion-nombre"
                className={styles.input}
                type="text"
                autoComplete="given-name"
                placeholder="Tu nombre o cómo quieres que te digamos"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={80}
              />
            </div>
            <button type="submit" className={styles.submitBtn}>
              Continuar
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className={styles.steps}>
            <div className={styles.stepCard}>
              <p className={styles.stepLabel}>{name}, ¿qué te motiva ahora mismo?</p>
              <div className={styles.chips}>
                {AFICIONES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={`${styles.chip} ${aficiones.includes(a) ? styles.chipSelected : ''}`}
                    onClick={() => toggleAficion(a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.stepCard}>
              <p className={styles.stepLabel}>¿Cuánto tiempo puedes dedicar al estudio?</p>
              <div className={styles.chips}>
                {DISPONIBILIDAD.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`${styles.chip} ${disponibilidad === d ? styles.chipSelected : ''}`}
                    onClick={() => setDisponibilidad(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.stepCard}>
              <p className={styles.stepLabel}>¿Cómo describirías tu formación en el tema?</p>
              <div className={styles.chips}>
                {FORMACION.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`${styles.chip} ${formacion === f ? styles.chipSelected : ''}`}
                    onClick={() => setFormacion(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className={styles.note}>
            Pronto conectaremos estas respuestas con el catálogo de cursos para mostrarte recomendaciones
            personalizadas. Mientras tanto, puedes seguir explorando en{' '}
            <strong>Categorías</strong> o el buscador del menú.
          </p>

          <button type="button" className={styles.reset} onClick={resetJourney}>
            Empezar de nuevo y cambiar el nombre
          </button>
        </>
      )}
    </div>
  );
}
