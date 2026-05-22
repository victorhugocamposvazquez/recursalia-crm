'use client';

import { QuizLessonDesktop, QuizLessonMobile } from '@/components/learn/quiz';
import { useIsMobileLearn } from '@/lib/learn/useIsMobileLearn';

type Props = {
  courseId: string;
  courseSlug: string;
  quizId: string;
};

export function AprenderQuizClient({ courseId, courseSlug, quizId }: Props) {
  const mobile = useIsMobileLearn();

  async function handleSubmitDemo() {
    const res = await fetch(`/api/quiz/${quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, answers: [] }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? 'Error al enviar el quiz');
      return;
    }
    window.location.href = `/aprender/cursos/${courseSlug}/resultados/${data.attemptId}`;
  }

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100dvh' }}>
      {mobile ? <QuizLessonMobile /> : <QuizLessonDesktop />}
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
        Enviar quiz
      </button>
    </div>
  );
}
