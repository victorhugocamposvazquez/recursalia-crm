import styles from './HeroVisualCollage.module.css';

export function HeroVisualCollage() {
  return (
    <div className={styles.root} aria-hidden>
      <div className={`${styles.card} ${styles.card1}`}>
        <p className={styles.cardTitle}>Tu progreso</p>
        <div className={styles.ring} />
        <div className={styles.bar} style={{ width: '85%' }} />
        <div className={styles.row}>
          <span>Módulos</span>
          <span>85%</span>
        </div>
      </div>
      <div className={`${styles.card} ${styles.card2}`}>
        <p className={styles.cardTitle}>Catálogo</p>
        <div className={styles.fakeGrid}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={styles.fakeCell} />
          ))}
        </div>
      </div>
      <div className={`${styles.card} ${styles.card3}`}>
        <p className={styles.cardTitle}>Cursos destacados</p>
        <div className={styles.thumbRow}>
          <div className={styles.thumb} />
          <div className={styles.thumb} />
          <div className={styles.thumb} />
        </div>
        <div className={styles.bar} style={{ width: '62%', marginTop: '0.65rem' }} />
        <div className={styles.row}>
          <span>Evaluación</span>
          <span>Q1</span>
        </div>
      </div>
    </div>
  );
}
