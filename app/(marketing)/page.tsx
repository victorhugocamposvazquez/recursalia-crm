import Link from 'next/link';
import styles from './marketing.module.css';
import { HomeHeroSearch } from '@/components/marketing/HomeHeroSearch';

export default function MarketingHomePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.inner}>
          <h1>
            La formación online que impulsa tu carrera{' '}
            <span className={styles.accent}>en español</span>
          </h1>
          <p className={styles.sub}>
            Cursos prácticos con temario claro, reseñas reales y acceso seguro por Hotmart.
          </p>
          <label className={styles.searchLabel} htmlFor="home-course-search">
            ¿Qué quieres aprender?
          </label>
          <div id="home-course-search">
            <HomeHeroSearch />
          </div>
          <p className={styles.footerNote}>
            <Link href="/cursos">Ver todos los cursos</Link>
            {' · '}
            <Link href="/login">Accede al panel de formación</Link>
          </p>
        </div>
      </section>
    </>
  );
}
