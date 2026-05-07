import Image from 'next/image';
import Link from 'next/link';
import { StarRatingDisplay } from '@/components/marketing/StarRatingDisplay';
import { COURSE_IMAGE_BLUR_DATA_URL } from '@/lib/imagePlaceholder';
import styles from './CourseRelated.module.css';

export type RelatedCourse = {
  id: string;
  publicSlug: string;
  title: string;
  imageUrl: string | null;
  sale: number | null;
  original: number | null;
  avgRating: number | null;
  reviewCount: number;
};

function formatMoney(n: number | undefined | null) {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

type Props = {
  heading: string;
  items: RelatedCourse[];
};

export function CourseRelated({ heading, items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="related-heading">
      <h2 id="related-heading" className={styles.heading}>
        {heading}
      </h2>
      <ul className={styles.grid}>
        {items.map((c) => {
          const showStrike =
            c.original != null && c.sale != null && c.sale < c.original;
          return (
            <li key={c.id}>
              <Link href={`/cursos/${c.publicSlug}`} className={styles.card}>
                <div className={styles.image}>
                  {c.imageUrl ? (
                    <Image
                      src={c.imageUrl}
                      alt=""
                      fill
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL={COURSE_IMAGE_BLUR_DATA_URL}
                      sizes="(max-width: 760px) 100vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : null}
                </div>
                <div className={styles.body}>
                  {c.avgRating != null && c.reviewCount > 0 ? (
                    <div className={styles.rating}>
                      <span className={styles.score}>
                        {c.avgRating.toFixed(1).replace('.', ',')}
                      </span>
                      <StarRatingDisplay value={c.avgRating} ariaHidden />
                      <span className={styles.count}>({c.reviewCount})</span>
                    </div>
                  ) : null}
                  <h3 className={styles.title}>{c.title}</h3>
                  <div className={styles.priceRow}>
                    {showStrike ? (
                      <span className={styles.original}>
                        {formatMoney(c.original)}
                      </span>
                    ) : null}
                    <span className={styles.sale}>
                      {formatMoney(c.sale ?? c.original)}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
