import Link from 'next/link';
import styles from './marketing.module.css';
import { HomeHeroSearch } from '@/components/marketing/HomeHeroSearch';

export default function MarketingHomePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.inner}>
          <h1>
            La formación online que impulsa{' '}
            <span className={styles.accent}>tu carrera profesional</span>
          </h1>
          <p className={styles.sub}>
            Cursos prácticos, temarios claros y acceso seguro. Aprende con la misma claridad visual
            que esperas de una plataforma profesional.
          </p>
          <label className={styles.searchLabel} htmlFor="home-course-search">
            ¿Qué quieres aprender?
          </label>
          <div id="home-course-search">
            <HomeHeroSearch />
          </div>
          <ul className={styles.trustRow} aria-label="Ventajas">
            <li>Contenido orientado al empleo</li>
            <li>Pago seguro con Hotmart</li>
            <li>Estudia a tu ritmo</li>
          </ul>
          <p className={styles.footerNote}>
            <Link href="/cursos">Explorar catálogo</Link>
            {' · '}
            <Link href="/login">Acceder al panel</Link>
          </p>
        </div>
      </section>
    </>
  );
}
