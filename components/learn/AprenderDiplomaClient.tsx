'use client';

import { RealDiplomaView } from '@/components/learn/RealDiplomaView';

type Props = {
  studentName: string;
  courseTitle: string;
  instructorName: string;
  certNumber: string;
  shareToken?: string | null;
  scorePct: number;
  totalLessons: number;
  totalDurationMinutes?: number;
  issuedAt: string;
};

export function AprenderDiplomaClient(props: Props) {
  return <RealDiplomaView {...props} />;
}
