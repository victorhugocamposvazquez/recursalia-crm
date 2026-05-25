'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LearnProvider, type LearnContextValue } from '@/lib/learn/context';
import { LessonTextDesktop, LessonTextMobile } from '@/components/learn/lesson';
import { useIsMobileLearn } from '@/lib/learn/useIsMobileLearn';

type Props = Omit<
  LearnContextValue,
  'onBackToHub' | 'onMarkComplete' | 'onUnmarkComplete' | 'onNextLesson'
> & {
  nextLessonUuid?: string | null;
  prevLessonUuid?: string | null;
};

export function AprenderLessonClient(props: Props) {
  const router = useRouter();
  const mobile = useIsMobileLearn();
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState<boolean>(Boolean(props.lessonCompleted));

  const goToLesson = (uuid: string) => {
    router.push(`/aprender/cursos/${props.courseSlug}/lecciones/${uuid}`);
  };

  const openLesson = (lessonUuid: string, kind: string) => {
    if (kind === 'quiz') {
      const qid = props.quizByLesson?.[lessonUuid] ?? lessonUuid;
      router.push(`/aprender/cursos/${props.courseSlug}/quiz/${qid}`);
      return;
    }
    if (kind === 'boss') {
      if (props.finalQuizId) router.push(`/aprender/cursos/${props.courseSlug}/examen`);
      return;
    }
    goToLesson(lessonUuid);
  };

  const markComplete = useCallback(async () => {
    if (!props.lessonUuid || completing) return;
    setCompleting(true);
    try {
      const res = await fetch('/api/learn/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: props.courseId,
          lessonId: props.lessonUuid,
          completed: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'No se pudo guardar el progreso');
      }
      setCompleted(true);
      router.refresh();
      if (props.nextLessonUuid) {
        router.push(
          `/aprender/cursos/${props.courseSlug}/lecciones/${props.nextLessonUuid}`
        );
      }
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Error al completar la lección');
    } finally {
      setCompleting(false);
    }
  }, [
    completing,
    props.courseId,
    props.courseSlug,
    props.lessonUuid,
    props.nextLessonUuid,
    router,
  ]);

  const unmarkComplete = useCallback(async () => {
    if (!props.lessonUuid || completing) return;
    setCompleting(true);
    try {
      const res = await fetch('/api/learn/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: props.courseId,
          lessonId: props.lessonUuid,
          completed: false,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'No se pudo actualizar el progreso');
      }
      setCompleted(false);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Error al desmarcar la lección');
    } finally {
      setCompleting(false);
    }
  }, [completing, props.courseId, props.courseSlug, props.lessonUuid, router]);

  const value: LearnContextValue = {
    ...props,
    lessonCompleted: completed,
    prevLessonUuid: props.prevLessonUuid,
    onBackToHub: () => router.push(`/aprender/cursos/${props.courseSlug}`),
    onGoHome: () => router.push('/aprender'),
    onLessonOpen: openLesson,
    onMarkComplete: markComplete,
    onUnmarkComplete: unmarkComplete,
    onPrevLesson: props.prevLessonUuid ? () => goToLesson(props.prevLessonUuid!) : undefined,
    onNextLesson: () => {
      if (props.nextLessonUuid) goToLesson(props.nextLessonUuid);
      else router.push(`/aprender/cursos/${props.courseSlug}`);
    },
  };

  return (
    <LearnProvider value={value}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, width: '100%' }}>
        {mobile ? (
          <LessonTextMobile tweak={props.tweak} completing={completing} />
        ) : (
          <LessonTextDesktop tweak={props.tweak} completing={completing} />
        )}
      </div>
    </LearnProvider>
  );
}
