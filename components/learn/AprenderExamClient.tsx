'use client';

import { useRouter } from 'next/navigation';
import { QuizBossDesktop, QuizBossMobile } from '@/components/learn/quiz';
import { useIsMobileLearn } from '@/lib/learn/useIsMobileLearn';

type Props = {
  courseId: string;
  courseSlug: string;
  quizId: string;
};

export function AprenderExamClient({ courseId, courseSlug, quizId }: Props) {
  const router = useRouter();
  const mobile = useIsMobileLearn();

  async function handleSubmitDemo() {
    const res = await fetch(`/api/quiz/${quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, answers: [] }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? 'Error al enviar el examen');
      return;
    }
    if (data.passed) {
      await fetch('/api/diploma/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, attemptId: data.attemptId }),
      });
    }
    router.push(`/aprender/cursos/${courseSlug}/resultados/${data.attemptId}`);
  }

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100dvh' }}>
      {mobile ? <QuizBossMobile /> : <QuizBossDesktop />}
      <button
        type="button"
        onClick={handleSubmitDemo}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 50,
          padding: '12px 20px',
          borderRadius: 999,
          border: 'none',
          background: '#1b38c4',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Finalizar examen
      </button>
    </div>
  );
}
