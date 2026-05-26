'use client';

import { QuizPlayer } from '@/components/learn/QuizPlayer';
import type { QuizQuestionRecord } from '@/types';

type Props = {
  courseId: string;
  courseSlug: string;
  quizId: string;
  title: string;
  questions: QuizQuestionRecord[];
  courseTitle?: string;
};

export function AprenderExamClient(props: Props) {
  return (
    <QuizPlayer
      {...props}
      isFinal
      backHref={`/aprender/cursos/${props.courseSlug}`}
    />
  );
}
