'use client';

import { QuizResultsDesktop, QuizResultsMobile } from '@/components/learn/quiz';
import { useIsMobileLearn } from '@/lib/learn/useIsMobileLearn';

export function AprenderResultsClient() {
  const mobile = useIsMobileLearn();
  return mobile ? <QuizResultsMobile /> : <QuizResultsDesktop />;
}
