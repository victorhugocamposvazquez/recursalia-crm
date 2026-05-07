import { siteCanonicalBase } from '@/lib/blog-seo';

export type CourseLdInput = {
  title: string;
  description: string;
  url: string;
  imageUrl?: string | null;
  authorName: string;
  publishedAt?: string | null;
  /** Precio efectivo (sale ?? original). */
  price?: number | null;
  /** Curso totalmente en línea. */
  language?: string;
  /** Reseñas para AggregateRating. */
  ratingValue?: number | null;
  ratingCount?: number | null;
  durationMinutes?: number | null;
};

export type BreadcrumbItem = { name: string; url: string };

/** JSON-LD Course + Offer + AggregateRating (si hay reseñas). */
export function courseJsonLd(input: CourseLdInput): Record<string, unknown> {
  const base = siteCanonicalBase();
  const url = input.url.startsWith('http') ? input.url : `${base}${input.url}`;
  const image = input.imageUrl
    ? input.imageUrl.startsWith('http')
      ? input.imageUrl
      : `${base}${input.imageUrl}`
    : undefined;

  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: input.title,
    description: input.description,
    url,
    inLanguage: (input.language ?? 'es').toLowerCase().startsWith('es')
      ? 'es'
      : input.language,
    provider: {
      '@type': 'Organization',
      name: 'Recursalia',
      url: base,
    },
    author: {
      '@type': 'Organization',
      name: input.authorName,
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload:
        input.durationMinutes && input.durationMinutes > 0
          ? `PT${Math.max(1, Math.round(input.durationMinutes / 60))}H`
          : undefined,
    },
  };

  if (image) json.image = image;
  if (input.publishedAt) json.datePublished = input.publishedAt;

  if (input.price != null && input.price > 0) {
    json.offers = {
      '@type': 'Offer',
      price: input.price,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url,
      category: 'Educación',
    };
  }

  if (
    input.ratingValue != null &&
    input.ratingCount != null &&
    input.ratingCount > 0
  ) {
    json.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(input.ratingValue.toFixed(2)),
      reviewCount: input.ratingCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return json;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  const base = siteCanonicalBase();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url.startsWith('http') ? it.url : `${base}${it.url}`,
    })),
  };
}
