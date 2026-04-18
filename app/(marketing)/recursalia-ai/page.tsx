import styles from '../marketing.module.css';

export const metadata = {
  title: 'Recursalia AI | Recursalia',
  description: 'Inteligencia aplicada a la formación y operaciones internas.',
};

export default function RecursaliaAiPage() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2>Recursalia AI</h2>
        <p className={styles.empty}>
          Estamos definiendo la experiencia pública de Recursalia AI. Para una demo o más detalle,
          contacta con hola@recursalia.com.
        </p>
      </div>
    </section>
  );
}
