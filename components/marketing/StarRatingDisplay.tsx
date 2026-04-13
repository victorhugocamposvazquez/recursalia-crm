import styles from './StarRatingDisplay.module.css';

type Props = {
  value: number;
  className?: string;
  /** Evita duplicar lectura en voz alta si la nota ya se anuncia al lado */
  ariaHidden?: boolean;
};

/** Estrellas 0–5 con relleno proporcional (p. ej. 4,9 → casi la quinta llena). */
export function StarRatingDisplay({
  value,
  className,
  ariaHidden,
}: Props) {
  const v = Math.min(5, Math.max(0, value));
  const label = `${v.toFixed(1).replace('.', ',')} de 5`;

  return (
    <span
      className={`${styles.wrap} ${className ?? ''}`}
      role={ariaHidden ? undefined : 'img'}
      aria-label={ariaHidden ? undefined : label}
      aria-hidden={ariaHidden ?? undefined}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(1, Math.max(0, v - i));
        return (
          <span key={i} className={styles.slot} aria-hidden>
            <span className={styles.starBg}>★</span>
            {fill > 0 ? (
              <span className={styles.starFg} style={{ width: `${fill * 100}%` }}>
                ★
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}
