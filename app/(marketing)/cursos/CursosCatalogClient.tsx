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
import {
  categoryLabel,
  type CatalogCategoryPublic,
} from '@/lib/catalogCategory';
import { StarRatingDisplay } from '@/components/marketing/StarRatingDisplay';

export type CourseCatalogEntry = {
  id: string;
  publicSlug: string;
  title: string;
  desc: string;
  imageUrl: string | null;
  category: string;
  showBestseller: boolean;
  bestsellerLabel: string;
  original?: number | null;
  sale?: number | null;
  avgRating: number | null;
  reviewCount: number;
};

export type CatalogCategoryFilter = string | 'all';

function formatMoney(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

function syncSearchParams(cat: CatalogCategoryFilter, q: string) {
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

function normalizeCatValue(
  raw: string,
  slugSet: ReadonlySet<string>
): CatalogCategoryFilter {
  if (raw === 'all') return 'all';
  if (slugSet.has(raw)) return raw;
  return 'all';
}

type Props = {
  courses: CourseCatalogEntry[];
  /** Categorías activas del catálogo (desde Supabase `catalog_categories`). */
  catalogOptions: CatalogCategoryPublic[];
  initialCategory: CatalogCategoryFilter;
  initialQuery: string;
};

export function CursosCatalogClient({
  courses,
  catalogOptions,
  initialCategory,
  initialQuery,
}: Props) {
  const slugSet = useMemo(
    () => new Set(catalogOptions.map((o) => o.slug)),
    [catalogOptions],
  );

  const [category, setCategory] =
    useState<CatalogCategoryFilter>(initialCategory);
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    syncSearchParams(category, query);
  }, [category, query]);

  useEffect(() => {
    setCategory((prev) =>
      prev === 'all' || slugSet.has(prev) ? prev : 'all'
    );
  }, [slugSet]);

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

  const totalCatalog = courses.length;

  const selectValue =
    category === 'all' || slugSet.has(category) ? category : 'all';

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
            value={selectValue}
            onChange={(e) =>
              setCategory(
                normalizeCatValue(e.target.value, slugSet),
              )
            }
            aria-controls="catalogo-resultados"
          >
            <option value="all">Todas</option>
            {catalogOptions.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className={cursosStyles.searchBeside}>
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

      <div className={cursosStyles.filterSummarySlot}>
        <p className={cursosStyles.filterSummary}>
          {activeFilters && category !== 'all' ? (
            <span>{categoryLabel(category, catalogOptions)} · </span>
          ) : null}
          <span>{filtered.length} resultado{filtered.length === 1 ? '' : 's'}</span>
          {totalCatalog > 0 ? (
            <span>{' · '}{totalCatalog} en catálogo</span>
          ) : null}
          {' · '}
          <button
            type="button"
            className={cursosStyles.clearBtn}
            disabled={!activeFilters}
            onClick={clearFilters}
          >
            Quitar filtros
          </button>
        </p>
      </div>

      <div className={cursosStyles.resultsZone}>
        {filtered.length === 0 ? (
          <p className={styles.empty}>
            {courses.length === 0 ? (
              'Aún no hay cursos publicados. Ejecuta la migración SQL en Supabase y publica desde el panel.'
            ) : category !== 'all' && !query.trim() ? (
              'No hay cursos publicados en esta categoría. Puedes asignar categoría desde la ficha del curso en el panel.'
            ) : activeFilters ? (
              'No hay cursos que coincidan con estos filtros.'
            ) : (
              'Sin resultados.'
            )}
          </p>
        ) : (
          <div id="catalogo-resultados" className={cursosStyles.gridTight}>
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
                      {c.showBestseller ? (
                        <span className={cursosStyles.bestsellerOnImage}>
                          <Image
                            src="/images/card-icon-1.webp"
                            alt=""
                            width={17}
                            height={17}
                            className={cursosStyles.bestsellerIcon}
                          />
                          {c.bestsellerLabel}
                        </span>
                      ) : null}
                    </div>
                    <div className={cursosStyles.cardBody}>
                      <div className={cursosStyles.topMetaRow}>
                        <div className={cursosStyles.reviewsTop}>
                          {avg != null && n > 0 ? (
                            <>
                              <span className={cursosStyles.score}>
                                {avg.toFixed(1).replace('.', ',')}
                              </span>
                              <span
                                className={cursosStyles.starsWrap}
                                aria-label={`${avg.toFixed(1).replace('.', ',')} de 5 estrellas`}
                              >
                                <StarRatingDisplay value={avg} ariaHidden />
                              </span>
                              <span className={cursosStyles.revNum} aria-label={`${n} valoraciones`}>
                                {n}
                              </span>
                            </>
                          ) : (
                            <span className={cursosStyles.ratingMuted}>—</span>
                          )}
                        </div>
                      </div>

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
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
