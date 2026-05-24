'use client';

import { useRouter } from 'next/navigation';
import { LearnProvider, type LearnContextValue } from '@/lib/learn/context';
import { QuizPlayer } from '@/components/learn/QuizPlayer';
import type { QuizQuestionRecord } from '@/types';

type Props = {
  courseId: string;
  courseSlug: string;
  quizId: string;
  title: string;
  isFinal?: boolean;
  questions: QuizQuestionRecord[];
};

export function AprenderQuizClient(props: Props) {
  return (
    <QuizPlayer
      {...props}
      backHref={`/aprender/cursos/${props.courseSlug}`}
    />
  );
}
