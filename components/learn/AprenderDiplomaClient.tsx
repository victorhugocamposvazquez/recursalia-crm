'use client';

import { DiplomaDesktop, DiplomaMobile } from '@/components/learn/diploma';
import { useIsMobileLearn } from '@/lib/learn/useIsMobileLearn';

export function AprenderDiplomaClient() {
  const mobile = useIsMobileLearn();
  return mobile ? <DiplomaMobile /> : <DiplomaDesktop />;
}
