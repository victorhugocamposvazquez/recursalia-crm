'use client';

import React, { createContext, useContext } from 'react';
import type { Course, Module, TweakOptions } from '@/components/learn/types';

export type EnrolledCourseCard = {
  slug: string;
  title: string;
  instructor: string;
  pct: number;
  nextLesson: string;
  time: string;
  tag: string;
  current?: boolean;
};

export type CompletedCourseCard = {
  title: string;
  instructor: string;
  date: string;
  score: number;
  certNumber?: string;
};

export type CurrentLessonInfo = {
  id: string;
  title: string;
  code?: string;
  dur: string;
  kind: string;
};

export type LearnContextValue = {
  tweak: TweakOptions;
  course: Course;
  modules: Module[];
  enrolled: EnrolledCourseCard[];
  completed: CompletedCourseCard[];
  courseSlug: string;
  courseId: string;
  userName?: string;
  currentLesson?: CurrentLessonInfo | null;
  lessonUuid?: string;
  lessonHtml?: string;
  lessonTitle?: string;
  /** Si la lección está marcada como completada para el usuario actual. */
  lessonCompleted?: boolean;
  onLessonOpen?: (lessonUuid: string, kind: string) => void;
  onBackToHub?: () => void;
  onGoHome?: () => void;
  onOpenCatalog?: () => void;
  onOpenDiploma?: (certNumber: string) => void;
  onStartExam?: () => void;
  onPrevLesson?: () => void;
  prevLessonUuid?: string | null;
  onMarkComplete?: () => void;
  /** Quita el flag de completada (descompleta). */
  onUnmarkComplete?: () => void;
  onNextLesson?: () => void;
  onCourseOpen?: (slug: string) => void;
  stats?: { xp: number; streak_days: number; level: number };
  quizByLesson?: Record<string, string>;
  /** Quiz por topic (módulo): topicId → metadata. */
  quizByTopic?: Record<
    string,
    {
      id: string;
      title: string;
      question_count: number;
      pass_threshold: number;
      bestScore: number | null;
    }
  >;
  /** Abrir el quiz de un módulo concreto. */
  onOpenTopicQuiz?: (quizId: string) => void;
  finalQuizId?: string | null;
  /** Metadata del examen final (si existe). */
  finalQuizMeta?: {
    id: string;
    title: string;
    question_count: number;
  } | null;
  examUnlocked?: boolean;
};

const LearnContext = createContext<LearnContextValue | null>(null);

export function LearnProvider({
  value,
  children,
}: {
  value: LearnContextValue;
  children: React.ReactNode;
}) {
  return <LearnContext.Provider value={value}>{children}</LearnContext.Provider>;
}

export function useLearnData(): LearnContextValue {
  const ctx = useContext(LearnContext);
  if (!ctx) {
    throw new Error('useLearnData requires LearnProvider');
  }
  return ctx;
}

export function useLearnDataOptional(): LearnContextValue | null {
  return useContext(LearnContext);
}
