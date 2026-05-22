'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LearnProvider, type LearnContextValue } from '@/lib/learn/context';
import { LessonTextDesktop, LessonTextMobile } from '@/components/learn/lesson';
import { useIsMobileLearn } from '@/lib/learn/useIsMobileLearn';

type Props = Omit<
  LearnContextValue,
  'onBackToHub' | 'onMarkComplete' | 'onNextLesson'
> & {
  nextLessonUuid?: string | null;
};

export function AprenderLessonClient(props: Props) {
  const router = useRouter();
  const mobile = useIsMobileLearn();
  const [completing, setCompleting] = useState(false);

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
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'No se pudo guardar el progreso');
      }
      if (props.nextLessonUuid) {
        router.push(
          `/aprender/cursos/${props.courseSlug}/lecciones/${props.nextLessonUuid}`
        );
      } else {
        router.push(`/aprender/cursos/${props.courseSlug}`);
      }
      router.refresh();
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

  const value: LearnContextValue = {
    ...props,
    onBackToHub: () => router.push(`/aprender/cursos/${props.courseSlug}`),
    onMarkComplete: markComplete,
    onNextLesson: () => {
      if (props.nextLessonUuid) {
        router.push(
          `/aprender/cursos/${props.courseSlug}/lecciones/${props.nextLessonUuid}`
        );
      } else {
        router.push(`/aprender/cursos/${props.courseSlug}`);
      }
    },
  };

  return (
    <LearnProvider value={value}>
      {mobile ? (
        <LessonTextMobile tweak={props.tweak} completing={completing} />
      ) : (
        <LessonTextDesktop tweak={props.tweak} completing={completing} />
      )}
    </LearnProvider>
  );
}
