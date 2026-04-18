import styles from '../marketing.module.css';

export const metadata = {
  title: 'Nosotros | Recursalia',
  description: 'Conoce al equipo y la misión de Recursalia.',
};

export default function NosotrosPage() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2>Nosotros</h2>
        <p className={styles.empty}>
          Estamos preparando esta página. Mientras tanto, puedes explorar el catálogo de cursos o
          escribirnos en hola@recursalia.com.
        </p>
      </div>
    </section>
  );
}
