'use client';

import { useRouter } from 'next/navigation';
import { LearnProvider, type LearnContextValue } from '@/lib/learn/context';
import { HubDesktop, HubMobile } from '@/components/learn/hub';
import { useIsMobileLearn } from '@/lib/learn/useIsMobileLearn';
import {
  findCurrentLessonFromModules,
  isReadyForFinalExam,
} from '@/lib/learn/courseAdapter';

type Props = Omit<
  LearnContextValue,
  'onLessonOpen' | 'onBackToHub' | 'onGoHome' | 'onStartExam' | 'currentLesson' | 'examUnlocked'
>;

export function AprenderHubClient(props: Props) {
  const router = useRouter();
  const mobile = useIsMobileLearn();
  const slug = props.courseSlug;

  const current = findCurrentLessonFromModules(props.modules);
  const examUnlocked = Boolean(props.finalQuizId) && isReadyForFinalExam(props.modules);

  const value: LearnContextValue = {
    ...props,
    currentLesson: current
      ? { id: current.id, title: current.title, code: current.code, dur: current.dur, kind: current.kind }
      : null,
    examUnlocked,
    onLessonOpen: (lessonUuid, kind) => {
      if (kind === 'quiz') {
        const qid = props.quizByLesson?.[lessonUuid] ?? lessonUuid;
        router.push(`/aprender/cursos/${slug}/quiz/${qid}`);
        return;
      }
      if (kind === 'boss') {
        if (props.finalQuizId && examUnlocked) {
          router.push(`/aprender/cursos/${slug}/examen`);
        }
        return;
      }
      router.push(`/aprender/cursos/${slug}/lecciones/${lessonUuid}`);
    },
    onOpenTopicQuiz: (quizId) => {
      router.push(`/aprender/cursos/${slug}/quiz/${quizId}`);
    },
    onBackToHub: () => router.push('/aprender'),
    onGoHome: () => router.push('/aprender'),
    onStartExam: () => {
      if (props.finalQuizId && examUnlocked) {
        router.push(`/aprender/cursos/${slug}/examen`);
      }
    },
  };

  return (
    <LearnProvider value={value}>
      {mobile ? <HubMobile tweak={props.tweak} /> : <HubDesktop tweak={props.tweak} />}
    </LearnProvider>
  );
}
