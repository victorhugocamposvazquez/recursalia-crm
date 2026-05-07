import Link from 'next/link';
import type { Metadata } from 'next';
import {
  PUBLIC_CATALOG_CATEGORIES_FALLBACK,
  type CatalogCategoryPublic,
} from '@/lib/catalogCategory';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import styles from './not-found.module.css';

export const metadata: Metadata = {
  title: 'Página no encontrada | Recursalia',
  robots: { index: false, follow: false },
};

export default async function NotFound() {
  let categories: CatalogCategoryPublic[] = PUBLIC_CATALOG_CATEGORIES_FALLBACK;
  try {
    const supabase = createPublicSupabaseClient();
    const { data } = await supabase
      .from('catalog_categories')
      .select('slug, label')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(8);
    if (data && data.length > 0) {
      categories = data as CatalogCategoryPublic[];
    }
  } catch {
    /* fallback */
  }

  return (
    <section className={styles.wrap}>
      <p className={styles.eyebrow}>Error 404</p>
      <h1 className={styles.title}>Esta página no existe o ha sido movida</h1>
      <p className={styles.lead}>
        Quizá te interese explorar el catálogo o usar el buscador para
        encontrar lo que necesitas.
      </p>

      <form
        method="get"
        action="/cursos"
        className={styles.searchForm}
        role="search"
      >
        <label htmlFor="not-found-q" className={styles.searchLabel}>
          Buscar cursos
        </label>
        <div className={styles.searchInputRow}>
          <input
            id="not-found-q"
            name="q"
            type="search"
            className={styles.searchInput}
            placeholder="¿Qué quieres aprender?"
            autoComplete="off"
          />
          <button type="submit" className={styles.searchSubmit}>
            Buscar
          </button>
        </div>
      </form>

      {categories.length > 0 ? (
        <div className={styles.categories}>
          <p className={styles.categoriesLabel}>Categorías populares</p>
          <ul className={styles.categoriesList}>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/cursos?cat=${encodeURIComponent(c.slug)}`}
                  className={styles.categoryLink}
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.actions}>
        <Link href="/" className={styles.primaryBtn}>
          Volver al inicio
        </Link>
        <Link href="/cursos" className={styles.secondaryBtn}>
          Ver catálogo completo
        </Link>
      </div>
    </section>
  );
}
