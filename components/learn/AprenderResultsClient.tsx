'use client';

import { ResultsView } from '@/components/learn/ResultsView';

type Props = {
  courseSlug: string;
  passed: boolean;
  scorePct: number;
  xpEarned: number;
  isFinal: boolean;
  certNumber?: string | null;
};

export function AprenderResultsClient(props: Props) {
  return <ResultsView {...props} />;
}
