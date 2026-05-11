'use client';

import { CourseSearchField } from './CourseSearchField';
import { useMarketingContent } from './MarketingContentProvider';

/** Buscador del hero: frases desde el panel Front web (rotativas en manuscrito). */
export function HomeHeroSearch() {
  const { searchCopy } = useMarketingContent();
  const phrases =
    searchCopy.heroLines.length > 0 ? searchCopy.heroLines : [searchCopy.hero];

  return (
    <CourseSearchField
      variant="hero"
      placeholder={phrases[0] ?? ''}
      typingPhrases={phrases}
      heroTypingAccent
    />
  );
}
