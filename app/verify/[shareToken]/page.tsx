import { notFound } from 'next/navigation';
import { getDiplomaByShareToken } from '@/lib/learn/lmsServer';

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
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: 32,
        fontFamily: 'system-ui, sans-serif',
        background: '#f4f4f0',
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #e5e5e0',
          padding: 32,
        }}
      >
        <p style={{ fontSize: 12, letterSpacing: 1, color: '#888', margin: 0 }}>RECURSALIA · VERIFICACIÓN</p>
        <h1 style={{ fontSize: 28, margin: '12px 0 8px', letterSpacing: -0.5 }}>Diploma válido</h1>
        <p style={{ color: '#555', lineHeight: 1.6, margin: '0 0 24px' }}>
          Certificado <strong>{diploma.cert_number}</strong> emitido el {issued}.
        </p>
        <dl style={{ margin: 0, display: 'grid', gap: 12 }}>
          <div>
            <dt style={{ fontSize: 12, color: '#888' }}>Curso</dt>
            <dd style={{ margin: '4px 0 0', fontWeight: 600 }}>{title}</dd>
          </div>
          <div>
            <dt style={{ fontSize: 12, color: '#888' }}>Calificación</dt>
            <dd style={{ margin: '4px 0 0', fontWeight: 600 }}>{scorePct}%</dd>
          </div>
        </dl>
      </div>
    </main>
  );
}
