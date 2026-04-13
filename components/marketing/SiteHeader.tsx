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
          <Link href="/cursos">Soluciones</Link>
          <Link href="/blog">Recursos</Link>
          <Link href="/cursos">Nosotros</Link>
          <Link href="/cursos">Nuestros Clientes</Link>
          <Link href="/cursos">Recursalia AI</Link>
          <Link href="/cursos">Referidos</Link>
          <Link href="/login" className={styles.ghost}>
            Ingresar
          </Link>
          <Link href="/cursos" className={styles.cta}>
            Agenda un demo
          </Link>
        </nav>
      </div>
    </header>
  );
}
