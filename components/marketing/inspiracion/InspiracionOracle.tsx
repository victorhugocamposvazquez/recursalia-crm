'use client';

import styles from './InspiracionOracle.module.css';

type Props = {
  /** Cambia en cada avance para reiniciar la animación del oráculo provisional. */
  pulseKey: number;
  brandLine?: string;
};

/**
 * Oráculo provisional (esfera + anillos + pulso al cambiar `pulseKey`).
 * Sustituir por el componente definitivo cuando esté listo.
 */
export function InspiracionOracle({ pulseKey, brandLine = 'Neurall' }: Props) {
  return (
    <div className={styles.wrap}>
      <div className={styles.rings} aria-hidden />
      <div className={styles.tick} aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className={styles.orbHost}>
        <div key={pulseKey} className={styles.orb} />
      </div>
      <p className={styles.brand}>—— {brandLine.toUpperCase()} ——</p>
    </div>
  );
}
