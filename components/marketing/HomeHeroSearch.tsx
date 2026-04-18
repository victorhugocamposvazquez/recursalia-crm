'use client';

import { CourseSearchField } from './CourseSearchField';
import { useMarketingContent } from './MarketingContentProvider';

/** Buscador del hero: placeholder desde el panel Front web. */
export function HomeHeroSearch() {
  const { searchCopy } = useMarketingContent();
  return <CourseSearchField variant="hero" placeholder={searchCopy.hero} />;
}
