import { notFound } from 'next/navigation';
import { getDiplomaByShareToken } from '@/lib/learn/lmsServer';
import styles from './verify.module.css';

type Props = { params: Promise<{ shareToken: string }> };

export default async function VerifyDiplomaPage({ params }: Props) {
  const { shareToken } = await params;
  const diploma = await getDiplomaByShareToken(shareToken);
  if (!diploma) notFound();

  const course = diploma.courses as {
    published_title?: string;
    generated_content?: { title?: string };
    public_slug?: string;
  } | null;
  const title =
    course?.published_title ?? course?.generated_content?.title ?? 'Curso Recursalia';
  const scorePct = Math.round((diploma.score ?? 0) * 100);
  const issued = new Date(diploma.issued_at).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={styles.page}>
      <article className={styles.card} aria-labelledby="verify-title">
        <p className={styles.kicker}>Recursalia · Verificación</p>
        <h1 id="verify-title" className={styles.title}>
          Diploma válido
        </h1>
        <p className={styles.lead}>
          Certificado <strong>{diploma.cert_number}</strong> emitido el {issued}.
        </p>

        <dl className={styles.meta}>
          <div>
            <dt>Curso</dt>
            <dd>{title}</dd>
          </div>
          <div>
            <dt>Calificación</dt>
            <dd>{scorePct}%</dd>
          </div>
        </dl>

        <div className={styles.badge} role="status">
          <span className={styles.badgeDot} aria-hidden />
          Autenticidad verificada
        </div>
      </article>
    </div>
  );
}
