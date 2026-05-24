import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser, getUserDiplomas } from '@/lib/learn/lmsServer';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

type CourseRef = {
  published_title?: string | null;
  generated_content?: { title?: string } | null;
  public_slug?: string | null;
};

type DiplomaRow = {
  cert_number: string;
  course_id: string;
  score: number | null;
  issued_at: string;
  courses: CourseRef | CourseRef[] | null;
};

function courseRef(row: DiplomaRow): CourseRef | null {
  if (!row.courses) return null;
  if (Array.isArray(row.courses)) return row.courses[0] ?? null;
  return row.courses;
}

function courseTitle(row: DiplomaRow): string {
  const c = courseRef(row);
  const gen = c?.generated_content?.title;
  return c?.published_title ?? gen ?? 'Curso';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default async function AprenderDiplomasPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login?redirectTo=/aprender/diplomas');
  }
  const rows = (await getUserDiplomas(user.id)) as unknown as DiplomaRow[];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Recursalia · Aprender</p>
          <h1 className={styles.title}>Mis diplomas</h1>
          <p className={styles.subtitle}>
            Aquí encontrarás los diplomas de los cursos que has aprobado, con su número de
            verificación.
          </p>
        </header>

        {rows.length === 0 ? (
          <section className={styles.emptyCard}>
            <div className={styles.emptyIcon} aria-hidden>
              <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
                <rect
                  x="6"
                  y="9"
                  width="36"
                  height="26"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M14 18h20M14 24h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="33" cy="38" r="5" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M30 41l-3 5 6-2 6 2-3-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className={styles.emptyTitle}>Todavía no hay diplomas disponibles</h2>
            <p className={styles.emptyText}>
              Cuando completes un curso y apruebes su examen final, tu diploma aparecerá aquí
              listo para descargar y compartir.
            </p>
            <div className={styles.emptyActions}>
              <Link href="/aprender" className={styles.btnPrimary}>
                Volver a mis cursos
              </Link>
              <Link href="/aprender/catalogo" className={styles.btnGhost}>
                Ver el catálogo
              </Link>
            </div>
          </section>
        ) : (
          <section className={styles.list} aria-label="Listado de diplomas">
            {rows.map((row) => (
              <Link
                key={row.cert_number}
                href={`/aprender/diplomas/${row.cert_number}`}
                className={styles.card}
              >
                <div className={styles.cardTop}>
                  <span className={styles.cardBadge}>Diploma</span>
                  <span className={styles.cardScore}>
                    {row.score != null ? `${Math.round(row.score)}%` : '—'}
                  </span>
                </div>
                <h3 className={styles.cardTitle}>{courseTitle(row)}</h3>
                <div className={styles.cardMeta}>
                  <span>Emitido el {formatDate(row.issued_at)}</span>
                  <span className={styles.cardCert}>{row.cert_number}</span>
                </div>
                <span className={styles.cardCta} aria-hidden>
                  Ver diploma
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12h14M13 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
