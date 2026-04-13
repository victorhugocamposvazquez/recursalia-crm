import Link from 'next/link';
import styles from './SiteHeader.module.css';

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link href="/" className={styles.logo}>
          Recur<span>salia</span>
        </Link>
        <nav className={styles.nav}>
          <Link href="/cursos">Cursos</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/login" className={styles.cta}>
            Acceder
          </Link>
        </nav>
      </div>
    </header>
  );
}
