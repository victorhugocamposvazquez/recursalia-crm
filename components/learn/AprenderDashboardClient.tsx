'use client';

import { useRouter } from 'next/navigation';
import { LearnProvider, type LearnContextValue } from '@/lib/learn/context';
import { DashboardDesktop, DashboardMobile } from '@/components/learn/dashboard';
import { useIsMobileLearn } from '@/lib/learn/useIsMobileLearn';

type Props = Omit<LearnContextValue, 'onCourseOpen' | 'onLessonOpen'>;

export function AprenderDashboardClient(props: Props) {
  const router = useRouter();
  const mobile = useIsMobileLearn();

  const value: LearnContextValue = {
    ...props,
    onCourseOpen: (slug) => router.push(`/aprender/cursos/${slug}`),
  };

  return (
    <LearnProvider value={value}>
      {mobile ? <DashboardMobile tweak={props.tweak} /> : <DashboardDesktop tweak={props.tweak} />}
    </LearnProvider>
  );
}
