import Link from 'next/link';
import { requireLearnUser } from '@/lib/learn/access';
import { getSupabase } from '@/lib/supabase';
import {
  ensureUserStats,
  getUserStats,
  getUserDiplomas,
} from '@/lib/learn/lmsServer';
import { LogrosXpHero } from '@/components/learn/LogrosXpHero';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

type DiplomaRow = {
  cert_number: string;
  issued_at: string;
  score: number | null;
};

export default async function LogrosPage() {
  const user = await requireLearnUser();
  await ensureUserStats(user.id);

  const admin = getSupabase();

  const [stats, diplomas, lessonsCount, quizzesCount, enrollmentsCount] =
    await Promise.all([
      getUserStats(user.id),
      getUserDiplomas(user.id) as Promise<DiplomaRow[]>,
      admin
        .from('user_lesson_progress')
        .select('lesson_id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .then((r) => r.count ?? 0),
      admin
        .from('quiz_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('passed', true)
        .then((r) => r.count ?? 0),
      admin
        .from('user_courses')
        .select('course_id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .then((r) => r.count ?? 0),
    ]);

  const totalDiplomas = diplomas.length;
  const bestScore = diplomas.reduce(
    (acc, d) => Math.max(acc, Math.round(((d.score as number) ?? 0) * 100)),
    0
  );

  const badges = buildBadges({
    streakDays: stats.streak_days,
    xp: stats.xp,
    level: stats.level,
    lessonsCompleted: lessonsCount,
    quizzesPassed: quizzesCount,
    diplomas: totalDiplomas,
    enrollments: enrollmentsCount,
  });

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Recursalia · Aprender</p>
          <h1 className={styles.title}>Mis logros</h1>
          <p className={styles.subtitle}>
            Sigue tu progreso, mantén la racha y consigue insignias completando lecciones,
            quizzes y exámenes finales.
          </p>
        </header>

        <LogrosXpHero
          xp={stats.xp}
          level={stats.level}
          streakDays={stats.streak_days}
          badgesUnlocked={unlockedCount}
          badgesTotal={badges.length}
        />

        <section className={styles.statsGrid} aria-label="Resumen de progreso">
          <StatCard
            label="XP total"
            value={stats.xp.toLocaleString('es-ES')}
            hint={`Nivel ${String(stats.level).padStart(2, '0')}`}
            tone="primary"
          />
          <StatCard
            label="Racha"
            value={`${stats.streak_days}`}
            hint={stats.streak_days === 1 ? 'día seguido' : 'días seguidos'}
            tone="accent"
          />
          <StatCard
            label="Lecciones"
            value={String(lessonsCount)}
            hint="completadas"
          />
          <StatCard
            label="Quizzes aprobados"
            value={String(quizzesCount)}
            hint={
              bestScore > 0 ? `Mejor nota: ${bestScore}%` : 'Aprueba con 70%'
            }
          />
          <StatCard
            label="Cursos"
            value={String(enrollmentsCount)}
            hint="en tu biblioteca"
          />
          <StatCard
            label="Diplomas"
            value={String(totalDiplomas)}
            hint={totalDiplomas > 0 ? 'obtenidos' : 'Aprueba el examen final'}
            tone="primary"
          />
        </section>

        <section className={styles.badgesSection} aria-label="Insignias">
          <div className={styles.badgesHead}>
            <h2 className={styles.badgesTitle}>Insignias</h2>
            <span className={styles.badgesProgress}>
              {unlockedCount} / {badges.length}
            </span>
          </div>
          <div className={styles.badgesGrid}>
            {badges.map((b) => (
              <article
                key={b.id}
                className={`${styles.badge} ${b.unlocked ? styles.badgeUnlocked : styles.badgeLocked}`.trim()}
                data-theme={b.theme}
                aria-label={b.unlocked ? `Insignia obtenida: ${b.title}` : `Insignia bloqueada: ${b.title}`}
              >
                <div
                  className={styles.badgeIcon}
                  data-theme={b.theme}
                  aria-hidden
                >
                  {b.icon}
                </div>
                <h3 className={styles.badgeTitle}>{b.title}</h3>
                <p className={styles.badgeDesc}>{b.desc}</p>
                {!b.unlocked && b.progress ? (
                  <div className={styles.badgeProgress}>
                    <div className={styles.badgeBar}>
                      <div
                        className={styles.badgeBarFill}
                        data-theme={b.theme}
                        style={{
                          width: `${Math.min(100, Math.round((b.progress.current / b.progress.target) * 100))}%`,
                        }}
                      />
                    </div>
                    <span className={styles.badgeProgressText}>
                      {b.progress.current}/{b.progress.target}
                    </span>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className={styles.cta} aria-label="Sigue aprendiendo">
          <div>
            <h2 className={styles.ctaTitle}>Sigue sumando XP</h2>
            <p className={styles.ctaText}>
              Cada lección completada y cada quiz aprobado te acerca a la siguiente insignia.
            </p>
          </div>
          <div className={styles.ctaActions}>
            <Link href="/aprender" className={styles.btnPrimary}>
              Continuar aprendiendo
            </Link>
            <Link href="/aprender/catalogo" className={styles.btnGhost}>
              Ver catálogo
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'primary' | 'accent';
}) {
  return (
    <div className={`${styles.stat} ${tone ? styles[`stat_${tone}`] : ''}`.trim()}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
      {hint ? <div className={styles.statHint}>{hint}</div> : null}
    </div>
  );
}

type BadgeTheme =
  | 'violet'
  | 'green'
  | 'blue'
  | 'cyan'
  | 'lime'
  | 'orange'
  | 'gold'
  | 'purple'
  | 'rose'
  | 'teal';

type Badge = {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  theme: BadgeTheme;
  unlocked: boolean;
  progress?: { current: number; target: number };
};

function buildBadges(input: {
  streakDays: number;
  xp: number;
  level: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  diplomas: number;
  enrollments: number;
}): Badge[] {
  return [
    {
      id: 'first-step',
      title: 'Primer paso',
      desc: 'Matricúlate en tu primer curso.',
      icon: <Sparkle />,
      theme: 'violet',
      unlocked: input.enrollments >= 1,
      progress: { current: Math.min(1, input.enrollments), target: 1 },
    },
    {
      id: 'first-lesson',
      title: 'Primera lección',
      desc: 'Completa tu primera lección.',
      icon: <Bolt />,
      theme: 'green',
      unlocked: input.lessonsCompleted >= 1,
      progress: { current: input.lessonsCompleted, target: 1 },
    },
    {
      id: 'ten-lessons',
      title: 'En marcha',
      desc: 'Completa 10 lecciones.',
      icon: <Stair />,
      theme: 'blue',
      unlocked: input.lessonsCompleted >= 10,
      progress: { current: input.lessonsCompleted, target: 10 },
    },
    {
      id: 'fifty-lessons',
      title: 'Estudiante constante',
      desc: 'Completa 50 lecciones.',
      icon: <Book />,
      theme: 'cyan',
      unlocked: input.lessonsCompleted >= 50,
      progress: { current: input.lessonsCompleted, target: 50 },
    },
    {
      id: 'first-quiz',
      title: 'Quiz aprobado',
      desc: 'Aprueba tu primer quiz.',
      icon: <Check />,
      theme: 'lime',
      unlocked: input.quizzesPassed >= 1,
      progress: { current: input.quizzesPassed, target: 1 },
    },
    {
      id: 'streak-3',
      title: 'Racha 3 días',
      desc: 'Estudia 3 días seguidos.',
      icon: <Fire />,
      theme: 'orange',
      unlocked: input.streakDays >= 3,
      progress: { current: input.streakDays, target: 3 },
    },
    {
      id: 'streak-7',
      title: 'Racha de oro',
      desc: 'Estudia 7 días seguidos.',
      icon: <Fire />,
      theme: 'gold',
      unlocked: input.streakDays >= 7,
      progress: { current: input.streakDays, target: 7 },
    },
    {
      id: 'streak-30',
      title: 'Fenómeno',
      desc: 'Estudia 30 días seguidos.',
      icon: <Crown />,
      theme: 'purple',
      unlocked: input.streakDays >= 30,
      progress: { current: input.streakDays, target: 30 },
    },
    {
      id: 'first-diploma',
      title: 'Diploma obtenido',
      desc: 'Aprueba un examen final.',
      icon: <Trophy />,
      theme: 'gold',
      unlocked: input.diplomas >= 1,
      progress: { current: input.diplomas, target: 1 },
    },
    {
      id: 'three-diplomas',
      title: 'Tres en raya',
      desc: 'Consigue 3 diplomas.',
      icon: <Trophy />,
      theme: 'rose',
      unlocked: input.diplomas >= 3,
      progress: { current: input.diplomas, target: 3 },
    },
    {
      id: 'xp-1000',
      title: '1.000 XP',
      desc: 'Acumula 1.000 puntos de experiencia.',
      icon: <Bolt />,
      theme: 'teal',
      unlocked: input.xp >= 1000,
      progress: { current: input.xp, target: 1000 },
    },
    {
      id: 'level-5',
      title: 'Nivel 5',
      desc: 'Sube a nivel 5.',
      icon: <Star />,
      theme: 'purple',
      unlocked: input.level >= 5,
      progress: { current: input.level, target: 5 },
    },
  ];
}

/* Iconos badges */
function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path
        d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
function Bolt() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path
        d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function Stair() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path
        d="M3 21h6v-4h6v-4h6V5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
function Book() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path
        d="M4 4h7a3 3 0 013 3v14a3 3 0 00-3-3H4V4zM20 4h-7a3 3 0 00-3 3v14a3 3 0 013-3h7V4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function Check() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function Fire() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path
        d="M12 2s5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4-1 0-2-1-2-3 0-1.5 1-3 5-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function Trophy() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path
        d="M7 4h10v4a5 5 0 01-10 0V4zM5 6H3v2a3 3 0 003 3M19 6h2v2a3 3 0 01-3 3M9 18h6v2H9zM10 14h4l-1 4h-2l-1-4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
function Crown() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path
        d="M3 18l2-10 5 5 2-8 2 8 5-5 2 10H3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function Star() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path
        d="M12 3l2.6 6 6.4.5-4.9 4.2 1.6 6.3L12 16.8 6.3 20l1.6-6.3L3 9.5 9.4 9 12 3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
