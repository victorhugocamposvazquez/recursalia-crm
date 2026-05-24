'use client';

import { useRouter } from 'next/navigation';
import { LearnProvider, type LearnContextValue } from '@/lib/learn/context';
import { DashboardDesktop, DashboardMobile } from '@/components/learn/dashboard';
import { useIsMobileLearn } from '@/lib/learn/useIsMobileLearn';
import {
  findCurrentLessonFromModules,
  isReadyForFinalExam,
} from '@/lib/learn/courseAdapter';

type Props = Omit<LearnContextValue, 'onCourseOpen' | 'onLessonOpen' | 'onGoHome' | 'onOpenCatalog' | 'onOpenDiploma'>;

export function AprenderDashboardClient(props: Props) {
  const router = useRouter();
  const mobile = useIsMobileLearn();

  const value: LearnContextValue = {
    ...props,
    onCourseOpen: (slug) => router.push(`/aprender/cursos/${slug}`),
    onGoHome: () => router.push('/aprender'),
    onOpenCatalog: () => router.push('/aprender/catalogo'),
    onOpenDiploma: (certNumber) => router.push(`/aprender/diplomas/${certNumber}`),
  };

  return (
    <LearnProvider value={value}>
      {mobile ? <DashboardMobile tweak={props.tweak} /> : <DashboardDesktop tweak={props.tweak} />}
    </LearnProvider>
  );
}
