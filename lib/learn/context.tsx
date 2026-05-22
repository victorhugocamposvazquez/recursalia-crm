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

export type LearnContextValue = {
  tweak: TweakOptions;
  course: Course;
  modules: Module[];
  enrolled: EnrolledCourseCard[];
  completed: { title: string; instructor: string; date: string; score: number }[];
  courseSlug: string;
  courseId: string;
  lessonUuid?: string;
  lessonHtml?: string;
  lessonTitle?: string;
  onLessonOpen?: (lessonUuid: string, kind: string) => void;
  onBackToHub?: () => void;
  onMarkComplete?: () => void;
  onNextLesson?: () => void;
  onCourseOpen?: (slug: string) => void;
  stats?: { xp: number; streak_days: number; level: number };
  quizByLesson?: Record<string, string>;
  finalQuizId?: string | null;
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
