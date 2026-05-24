import Link from 'next/link';
import { requireLearnUser } from '@/lib/learn/access';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function GuardadosPage() {
  await requireLearnUser();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Recursalia · Aprender</p>
          <h1 className={styles.title}>Guardados</h1>
          <p className={styles.subtitle}>
            Aquí encontrarás las lecciones y recursos que marques para volver más tarde.
          </p>
        </header>

        <section className={styles.empty}>
          <div className={styles.emptyIcon} aria-hidden>
            <svg viewBox="0 0 48 48" width="44" height="44" fill="none">
              <path
                d="M14 6h20v36l-10-6-10 6V6z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className={styles.emptyTitle}>Todavía no tienes nada guardado</h2>
          <p className={styles.emptyText}>
            Pronto podrás marcar lecciones, recursos y cursos como favoritos desde cada vista.
            Mientras tanto, abre tu siguiente lección desde &laquo;Mis cursos&raquo; o explora
            el catálogo.
          </p>
          <div className={styles.actions}>
            <Link href="/aprender" className={styles.btnPrimary}>
              Ir a mis cursos
            </Link>
            <Link href="/aprender/catalogo" className={styles.btnGhost}>
              Explorar catálogo
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
