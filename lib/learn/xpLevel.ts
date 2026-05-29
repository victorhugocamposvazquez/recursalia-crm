/** XP necesaria por nivel (debe coincidir con progress + quiz submit). */
export const XP_PER_LEVEL = 400;

export function xpLevelFromTotal(xp: number): number {
  return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
}

export function xpProgressInLevel(xp: number, level: number) {
  const xpAtLevelStart = (level - 1) * XP_PER_LEVEL;
  const xpInCurrentLevel = Math.max(0, xp - xpAtLevelStart);
  const pct = Math.min(100, (xpInCurrentLevel / XP_PER_LEVEL) * 100);
  const xpToNext = Math.max(0, XP_PER_LEVEL - xpInCurrentLevel);
  return {
    xpInCurrentLevel,
    xpPerLevel: XP_PER_LEVEL,
    pct,
    xpToNext,
    nextLevel: level + 1,
  };
}
