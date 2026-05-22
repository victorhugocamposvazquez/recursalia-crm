'use client';

import { useRouter } from 'next/navigation';
import { LearnProvider, type LearnContextValue } from '@/lib/learn/context';
import { HubDesktop, HubMobile } from '@/components/learn/hub';
import { useIsMobileLearn } from '@/lib/learn/useIsMobileLearn';

type Props = Omit<LearnContextValue, 'onLessonOpen' | 'onBackToHub'>;

export function AprenderHubClient(props: Props) {
  const router = useRouter();
  const mobile = useIsMobileLearn();
  const slug = props.courseSlug;

  const value: LearnContextValue = {
    ...props,
    onLessonOpen: (lessonUuid, kind) => {
      if (kind === 'quiz') {
        const qid = props.quizByLesson?.[lessonUuid] ?? lessonUuid;
        router.push(`/aprender/cursos/${slug}/quiz/${qid}`);
        return;
      }
      if (kind === 'boss') {
        if (props.finalQuizId) {
          router.push(`/aprender/cursos/${slug}/examen`);
        }
        return;
      }
      router.push(`/aprender/cursos/${slug}/lecciones/${lessonUuid}`);
    },
    onBackToHub: () => router.push('/aprender'),
  };

  return (
    <LearnProvider value={value}>
      {mobile ? <HubMobile tweak={props.tweak} /> : <HubDesktop tweak={props.tweak} />}
    </LearnProvider>
  );
}
