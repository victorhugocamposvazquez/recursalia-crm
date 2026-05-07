'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from '../marketing.module.css';
import cursosStyles from './cursos-index.module.css';
import {
  categoryLabel,
  type CatalogCategoryPublic,
} from '@/lib/catalogCategory';
import { StarRatingDisplay } from '@/components/marketing/StarRatingDisplay';
import { COURSE_IMAGE_BLUR_DATA_URL } from '@/lib/imagePlaceholder';

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
  /** Para badge "Nuevo" si <30 días y para orden por recientes. */
  publishedAt?: string | null;
};

export type CatalogCategoryFilter = string | 'all';

export type CatalogSort =
  | 'popular'
  | 'rating'
  | 'recent'
  | 'price_asc'
  | 'price_desc';

const SORT_OPTIONS: { id: CatalogSort; label: string }[] = [
  { id: 'popular', label: 'Más populares' },
  { id: 'rating', label: 'Mejor valorados' },
  { id: 'recent', label: 'Más recientes' },
  { id: 'price_asc', label: 'Precio: menor a mayor' },
  { id: 'price_desc', label: 'Precio: mayor a menor' },
];

const STORAGE_KEY = 'recursalia.catalog.state.v1';
const NEW_COURSE_DAYS = 30;
const SEARCH_DEBOUNCE_MS = 280;

function formatMoney(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

function discountPercent(original?: number | null, sale?: number | null): number | null {
  if (!original || !sale || sale >= original) return null;
  return Math.round((1 - sale / original) * 100);
}

function isNewCourse(publishedAt?: string | null): boolean {
  if (!publishedAt) return false;
  const t = new Date(publishedAt).getTime();
  if (!Number.isFinite(t)) return false;
  const ageMs = Date.now() - t;
  return ageMs >= 0 && ageMs <= NEW_COURSE_DAYS * 24 * 60 * 60 * 1000;
}

function syncSearchParams(cat: CatalogCategoryFilter, q: string, sort: CatalogSort) {
  const sp = new URLSearchParams();
  const qt = q.trim();
  if (qt) sp.set('q', qt);
  if (cat !== 'all') sp.set('cat', cat as string);
  if (sort !== 'popular') sp.set('sort', sort);
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

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Resalta `term` (case insensitive) en `text` con <mark>. */
function highlightTerm(text: string, term: string) {
  const t = term.trim();
  if (!t) return text;
  const re = new RegExp(`(${escapeRegExp(t)})`, 'ig');
  const parts = text.split(re);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className={cursosStyles.markHit}>
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function sortCourses(list: CourseCatalogEntry[], sort: CatalogSort): CourseCatalogEntry[] {
  const arr = list.slice();
  switch (sort) {
    case 'rating':
      return arr.sort((a, b) => (b.avgRating ?? -1) - (a.avgRating ?? -1));
    case 'recent':
      return arr.sort((a, b) => {
        const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return tb - ta;
      });
    case 'price_asc':
      return arr.sort(
        (a, b) =>
          (a.sale ?? a.original ?? Number.POSITIVE_INFINITY) -
          (b.sale ?? b.original ?? Number.POSITIVE_INFINITY)
      );
    case 'price_desc':
      return arr.sort(
        (a, b) =>
          (b.sale ?? b.original ?? Number.NEGATIVE_INFINITY) -
          (a.sale ?? a.original ?? Number.NEGATIVE_INFINITY)
      );
    case 'popular':
    default:
      return arr.sort((a, b) => {
        if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
        return (b.avgRating ?? 0) - (a.avgRating ?? 0);
      });
  }
}

type Props = {
  courses: CourseCatalogEntry[];
  catalogOptions: CatalogCategoryPublic[];
  initialCategory: CatalogCategoryFilter;
  initialQuery: string;
  initialSort?: CatalogSort;
};

export function CursosCatalogClient({
  courses,
  catalogOptions,
  initialCategory,
  initialQuery,
  initialSort,
}: Props) {
  const slugSet = useMemo(
    () => new Set(catalogOptions.map((o) => o.slug)),
    [catalogOptions],
  );

  const [category, setCategory] =
    useState<CatalogCategoryFilter>(initialCategory);
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<CatalogSort>(initialSort ?? 'popular');
  const [hydrated, setHydrated] = useState(false);

  /** Carga estado previo si el usuario navega "atrás" y no hay query string explícita. */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const hasUrlState = sp.has('q') || sp.has('cat') || sp.has('sort');
    if (!hasUrlState) {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            cat?: string;
            q?: string;
            sort?: CatalogSort;
            scroll?: number;
          };
          if (parsed.cat && (parsed.cat === 'all' || slugSet.has(parsed.cat))) {
            setCategory(parsed.cat as CatalogCategoryFilter);
          }
          if (typeof parsed.q === 'string') {
            setQueryInput(parsed.q);
            setQuery(parsed.q);
          }
          if (parsed.sort && SORT_OPTIONS.some((s) => s.id === parsed.sort)) {
            setSort(parsed.sort);
          }
          if (typeof parsed.scroll === 'number' && parsed.scroll > 0) {
            requestAnimationFrame(() => {
              window.scrollTo({ top: parsed.scroll!, behavior: 'auto' });
            });
          }
        }
      } catch {
        /* ignore */
      }
    }
    setHydrated(true);
  }, [slugSet]);

  /** Debounce del input de búsqueda. */
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setQuery(queryInput);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [queryInput]);

  /** Sincroniza URL + sessionStorage. */
  useEffect(() => {
    if (!hydrated) return;
    syncSearchParams(category, query, sort);
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          cat: category,
          q: query,
          sort,
          scroll: typeof window !== 'undefined' ? window.scrollY : 0,
        })
      );
    } catch {
      /* ignore */
    }
  }, [hydrated, category, query, sort]);

  /** Persistir scroll al salir hacia una ficha. */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const persist = () => {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        const obj = raw ? JSON.parse(raw) : {};
        obj.scroll = window.scrollY;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('pagehide', persist);
    return () => window.removeEventListener('pagehide', persist);
  }, []);

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
    return sortCourses(list, sort);
  }, [courses, category, qLower, sort]);

  const activeFilters = Boolean(query.trim()) || category !== 'all';

  const clearFilters = useCallback(() => {
    setCategory('all');
    setQueryInput('');
    setQuery('');
  }, []);

  const totalCatalog = courses.length;
  const totalInCategory = useMemo(
    () =>
      category === 'all'
        ? totalCatalog
        : courses.filter((c) => c.category === category).length,
    [courses, category, totalCatalog]
  );

  const selectValue =
    category === 'all' || slugSet.has(category) ? category : 'all';

  const currentCategoryLabel =
    category === 'all'
      ? 'Todas las categorías'
      : categoryLabel(category, catalogOptions);

  return (
    <>
      <h2 className={cursosStyles.catalogH2}>Cursos</h2>

      <div
        className={cursosStyles.chips}
        role="group"
        aria-label="Filtrar por categoría"
      >
        <button
          type="button"
          className={`${cursosStyles.chip} ${category === 'all' ? cursosStyles.chipActive : ''}`}
          aria-pressed={category === 'all'}
          onClick={() => setCategory('all')}
        >
          Todas
          <span className={cursosStyles.chipCount}>{totalCatalog}</span>
        </button>
        {catalogOptions.map((o) => {
          const count = courses.filter((c) => c.category === o.slug).length;
          if (count === 0) return null;
          const active = category === o.slug;
          return (
            <button
              key={o.slug}
              type="button"
              className={`${cursosStyles.chip} ${active ? cursosStyles.chipActive : ''}`}
              aria-pressed={active}
              onClick={() => setCategory(o.slug)}
            >
              {o.label}
              <span className={cursosStyles.chipCount}>{count}</span>
            </button>
          );
        })}
      </div>

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
              setCategory(normalizeCatValue(e.target.value, slugSet))
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

        <div className={cursosStyles.filterField}>
          <label htmlFor="curso-orden" className={cursosStyles.fieldLabel}>
            Ordenar
          </label>
          <select
            id="curso-orden"
            className={cursosStyles.select}
            value={sort}
            onChange={(e) => setSort(e.target.value as CatalogSort)}
            aria-controls="catalogo-resultados"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
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
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            autoComplete="off"
            aria-label="Filtrar cursos por texto"
            aria-controls="catalogo-resultados"
          />
        </div>
      </div>

      <div className={cursosStyles.filterSummarySlot}>
        <p
          className={cursosStyles.filterSummary}
          aria-live="polite"
          aria-atomic="true"
        >
          {activeFilters && category !== 'all' ? (
            <span>{currentCategoryLabel} · </span>
          ) : null}
          <span>
            {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
          </span>
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
          <div className={cursosStyles.emptyBlock}>
            <p className={styles.empty}>
              {courses.length === 0 ? (
                'Estamos preparando este catálogo. Vuelve en unos días.'
              ) : qLower && category !== 'all' ? (
                <>
                  No encontramos cursos con &laquo;{query.trim()}&raquo; en{' '}
                  <strong>{currentCategoryLabel}</strong>.
                </>
              ) : qLower ? (
                <>No encontramos cursos con &laquo;{query.trim()}&raquo;.</>
              ) : category !== 'all' ? (
                'No hay cursos publicados en esta categoría todavía.'
              ) : (
                'Sin resultados.'
              )}
            </p>
            <div className={cursosStyles.emptyActions}>
              {category !== 'all' && totalInCategory > 0 ? (
                <button
                  type="button"
                  className={cursosStyles.linkBtn}
                  onClick={() => {
                    setQueryInput('');
                    setQuery('');
                  }}
                >
                  Ver toda la categoría {currentCategoryLabel}
                </button>
              ) : null}
              {activeFilters ? (
                <button
                  type="button"
                  className={cursosStyles.linkBtn}
                  onClick={clearFilters}
                >
                  Quitar todos los filtros
                </button>
              ) : null}
              <Link href="/cursos" className={cursosStyles.linkBtn}>
                Ir al catálogo completo
              </Link>
            </div>
          </div>
        ) : (
          <div id="catalogo-resultados" className={cursosStyles.gridTight}>
            {filtered.map((c, idx) => {
              const sale = c.sale ?? undefined;
              const original = c.original ?? undefined;
              const showStrike =
                original != null && sale != null && sale < original;
              const discount = discountPercent(original, sale);
              const fresh = isNewCourse(c.publishedAt);
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
                          loading={idx < 4 ? 'eager' : 'lazy'}
                          placeholder="blur"
                          blurDataURL={COURSE_IMAGE_BLUR_DATA_URL}
                          sizes="(max-width: 520px) 100vw, (max-width: 900px) 50vw, 25vw"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : null}
                      <div className={cursosStyles.imageBadgesLeft} aria-hidden={false}>
                        {fresh ? (
                          <span className={`${cursosStyles.imageBadge} ${cursosStyles.imageBadgeNew}`}>
                            Nuevo
                          </span>
                        ) : null}
                        {discount != null ? (
                          <span className={`${cursosStyles.imageBadge} ${cursosStyles.imageBadgeDiscount}`}>
                            −{discount}%
                          </span>
                        ) : null}
                      </div>
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

                      <h3 className={cursosStyles.title}>
                        {qLower ? highlightTerm(c.title, query.trim()) : c.title}
                      </h3>

                      {c.desc ? (
                        <p className={cursosStyles.desc}>
                          {qLower ? highlightTerm(c.desc, query.trim()) : c.desc}
                        </p>
                      ) : null}

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
