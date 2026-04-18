'use client';

import Link from 'next/link';
import { useMarketingContent } from '@/components/marketing/MarketingContentProvider';
import homeStyles from '@/app/(marketing)/home.module.css';

/** Grid de categorías de la home (datos desde el panel Front web). */
export function HomeCategoryGrid() {
  const { categories } = useMarketingContent();

  return (
    <div className={homeStyles.catGrid}>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/cursos?q=${encodeURIComponent(c.q)}`}
          className={homeStyles.catLink}
        >
          {c.label}
        </Link>
      ))}
    </div>
  );
}
