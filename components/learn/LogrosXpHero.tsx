import { xpProgressInLevel } from '@/lib/learn/xpLevel';
import styles from '@/app/(learn)/aprender/logros/page.module.css';

type Props = {
  xp: number;
  level: number;
  streakDays: number;
  badgesUnlocked: number;
  badgesTotal: number;
};

export function LogrosXpHero({
  xp,
  level,
  streakDays,
  badgesUnlocked,
  badgesTotal,
}: Props) {
  const { xpInCurrentLevel, xpPerLevel, pct, xpToNext, nextLevel } = xpProgressInLevel(
    xp,
    level
  );

  return (
    <section className={styles.xpHero} aria-label="Progreso de experiencia">
      <div className={styles.xpHeroGlow} aria-hidden />

      <div className={styles.xpHeroTop}>
        <div className={styles.xpLevelBadge} aria-label={`Nivel ${level}`}>
          <span className={styles.xpLevelLabel}>NIVEL</span>
          <span className={styles.xpLevelNum}>{String(level).padStart(2, '0')}</span>
        </div>

        <div className={styles.xpHeroMain}>
          <div className={styles.xpHeroRow}>
            <span className={styles.xpHeroKicker}>Experiencia total</span>
            {streakDays > 0 ? (
              <span className={styles.xpStreakPill}>
                <span aria-hidden>🔥</span> Racha {streakDays}d
              </span>
            ) : null}
          </div>
          <div className={styles.xpHeroValue}>
            <span className={styles.xpHeroBolt} aria-hidden>
              ⚡
            </span>
            {xp.toLocaleString('es-ES')} XP
          </div>
        </div>

        <div className={styles.xpBadgesPill}>
          <span className={styles.xpBadgesPillLabel}>Insignias</span>
          <span className={styles.xpBadgesPillValue}>
            {badgesUnlocked}/{badgesTotal}
          </span>
        </div>
      </div>

      <div className={styles.xpBarBlock}>
        <div className={styles.xpBarMeta}>
          <span>
            {xpInCurrentLevel.toLocaleString('es-ES')} / {xpPerLevel.toLocaleString('es-ES')} XP
          </span>
          <span>
            {xpToNext > 0
              ? `${xpToNext.toLocaleString('es-ES')} XP para nivel ${nextLevel}`
              : '¡Nivel completado!'}
          </span>
        </div>
        <div
          className={styles.xpBarTrack}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso hacia el nivel ${nextLevel}`}
        >
          <div
            className={styles.xpBarFill}
            style={{ ['--xp-pct' as string]: `${pct}%` }}
          />
          <div className={styles.xpBarShine} aria-hidden />
        </div>
      </div>
    </section>
  );
}
