import Link from 'next/link';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <strong>Recursalia</strong>
          <Link href="/cursos">Catálogo de cursos</Link>
          <Link href="/blog">Blog</Link>
        </div>
        <div>
          <strong>Plataforma</strong>
          <Link href="/login">Acceso formación</Link>
        </div>
        <div>
          <strong>Legal</strong>
          <span style={{ color: '#94a3b8' }}>Aviso legal y privacidad (pendiente)</span>
        </div>
      </div>
      <p className={styles.copy}>© {new Date().getFullYear()} Recursalia</p>
    </footer>
  );
}
