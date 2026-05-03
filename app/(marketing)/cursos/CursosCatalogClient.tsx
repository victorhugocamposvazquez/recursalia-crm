'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import styles from '../marketing.module.css';
import cursosStyles from './cursos-index.module.css';
import type { CourseVertical } from '@/types';
import { StarRatingDisplay } from '@/components/marketing/StarRatingDisplay';

const VERTICAL_LABELS: Record<CourseVertical, string> = {
  general: 'General',
  professional_soft: 'Profesional',
  creative: 'Creativo',
  technical_skills: 'Técnico',
};

const VERTICAL_ORDER: CourseVertical[] = [
  'general',
  'professional_soft',
  'creative',
  'technical_skills',
];

export type CourseCatalogEntry = {
  id: string;
  publicSlug: string;
  title: string;
  desc: string;
  imageUrl: string | null;
  category: CourseVertical;
  showBestseller: boolean;
  bestsellerLabel: string;
  original?: number | null;
  sale?: number | null;
  avgRating: number | null;
  reviewCount: number;
};

export type CatalogCategoryOption = CourseVertical | 'all';

function formatMoney(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

function syncSearchParams(cat: CatalogCategoryOption, q: string) {
  const sp = new URLSearchParams();
  const qt = q.trim();
  if (qt) sp.set('q', qt);
  if (cat !== 'all') sp.set('cat', cat as string);
  const qs = sp.toString();
  const path = qs ? `/cursos?${qs}` : '/cursos';
  if (typeof window !== 'undefined') {
    window.history.replaceState(null, '', path);
  }
}

type Props = {
  courses: CourseCatalogEntry[];
  initialCategory: CatalogCategoryOption;
  initialQuery: string;
  /** Verticales con al menos un curso (vacío ⇒ mostrar todas en el selector). */
  usedCategories: CourseVertical[];
};

export function CursosCatalogClient({
  courses,
  initialCategory,
  initialQuery,
  usedCategories,
}: Props) {
  const [category, setCategory] =
    useState<CatalogCategoryOption>(initialCategory);
  const [query, setQuery] = useState(initialQuery);

  const categoryOptions = useMemo(() => {
    const bases =
      usedCategories.length > 0
        ? VERTICAL_ORDER.filter((v) => usedCategories.includes(v))
        : VERTICAL_ORDER;
    return bases;
  }, [usedCategories]);

  useEffect(() => {
    syncSearchParams(category, query);
  }, [category, query]);

  const qLower = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    let list = courses;
    if (category !== 'all') {
      list = list.filter((c) => c.category === category);
    }
    if (qLower) {
      list = list.filter((c) => {
        const title = c.title.toLowerCase();
        const desc = (c.desc || '').toLowerCase();
        return title.includes(qLower) || desc.includes(qLower);
      });
    }
    return list;
  }, [courses, category, qLower]);

  const activeFilters =
    Boolean(query.trim()) || category !== 'all';

  const clearFilters = useCallback(() => {
    setCategory('all');
    setQuery('');
    syncSearchParams('all', '');
  }, []);

  const onCategoryChange = (v: CatalogCategoryOption) => {
    setCategory(v);
  };

  return (
    <>
      <h2 className={cursosStyles.catalogH2}>Cursos</h2>

      <div className={cursosStyles.toolbar}>
        <div className={cursosStyles.filterField}>
          <label htmlFor="curso-categoria" className={cursosStyles.fieldLabel}>
            Categoría
          </label>
          <select
            id="curso-categoria"
            className={cursosStyles.select}
            value={category}
            onChange={(e) =>
              onCategoryChange(normalizeCatValue(e.target.value))
            }
            aria-controls="catalogo-resultados"
          >
            <option value="all">Todas</option>
            {categoryOptions.map((v) => (
              <option key={v} value={v}>
                {VERTICAL_LABELS[v]}
              </option>
            ))}
          </select>
        </div>

        <div className={cursosStyles.searchForm}>
          <label htmlFor="curso-busqueda" className={cursosStyles.fieldLabel}>
            Buscar
          </label>
          <input
            id="curso-busqueda"
            type="search"
            className={cursosStyles.searchInputFull}
            placeholder="Título o descripción…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            aria-label="Filtrar cursos por texto"
            aria-controls="catalogo-resultados"
          />
        </div>
      </div>

      {activeFilters ? (
        <p className={cursosStyles.filterSummary}>
          {[category !== 'all' ? VERTICAL_LABELS[category] : null,
            query.trim() ? `«${query.trim()}»` : null]
            .filter(Boolean)
            .join(' · ')}
          {' · '}
          {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
          {' · '}
          <button
            type="button"
            className={cursosStyles.clearBtn}
            onClick={clearFilters}
          >
            Quitar filtros
          </button>
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <p className={styles.empty}>
          {activeFilters
            ? 'No hay cursos que coincidan con estos filtros.'
            : courses.length === 0
              ? 'Aún no hay cursos publicados. Ejecuta la migración SQL en Supabase y publica desde el panel.'
              : 'Sin resultados.'}
        </p>
      ) : (
        <div
          id="catalogo-resultados"
          className={cursosStyles.gridTight}
        >
          {filtered.map((c) => {
            const sale = c.sale ?? undefined;
            const original = c.original ?? undefined;
            const showStrike =
              original != null &&
              sale != null &&
              sale < original;
            const avg = c.avgRating;
            const n = c.reviewCount;

            return (
              <article key={c.id} className={cursosStyles.card}>
                <Link href={`/cursos/${c.publicSlug}`}>
                  <div className={cursosStyles.cardImage}>
                    {c.imageUrl ? (
                      <Image
                        src={c.imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 520px) 100vw, (max-width: 900px) 50vw, 25vw"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : null}
                  </div>
                  <div className={cursosStyles.cardBody}>
                    {c.showBestseller ? (
                      <div className={cursosStyles.badgesRow}>
                        <span className={cursosStyles.bestseller}>
                          <Image
                            src="/images/card-icon-1.webp"
                            alt=""
                            width={17}
                            height={17}
                            className={cursosStyles.bestsellerIcon}
                          />
                          {c.bestsellerLabel}
                        </span>
                      </div>
                    ) : null}

                    <h3 className={cursosStyles.title}>{c.title}</h3>

                    {c.desc ? <p className={cursosStyles.desc}>{c.desc}</p> : null}

                    <div className={cursosStyles.priceRow}>
                      {showStrike ? (
                        <span className={cursosStyles.original}>
                          {formatMoney(original)}
                        </span>
                      ) : null}
                      <span className={cursosStyles.sale}>
                        {formatMoney(sale ?? original)}
                      </span>
                    </div>

                    <div className={cursosStyles.reviewsBlockCompact}>
                      {avg != null && n > 0 ? (
                        <div className={cursosStyles.ratingRowCompact}>
                          <span className={cursosStyles.score}>
                            {avg.toFixed(1).replace('.', ',')}
                          </span>
                          <span
                            className={cursosStyles.starsWrap}
                            aria-label={`${avg.toFixed(1).replace('.', ',')} de 5 estrellas`}
                          >
                            <StarRatingDisplay value={avg} ariaHidden />
                          </span>
                          <span
                            className={cursosStyles.revNum}
                            aria-label={`${n} valoraciones`}
                          >
                            {n}
                          </span>
                        </div>
                      ) : (
                        <span className={cursosStyles.ratingMuted}>—</span>
                      )}
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function normalizeCatValue(raw: string): CatalogCategoryOption {
  if (
    raw === 'general' ||
    raw === 'professional_soft' ||
    raw === 'creative' ||
    raw === 'technical_skills'
  ) {
    return raw;
  }
  return 'all';
}
