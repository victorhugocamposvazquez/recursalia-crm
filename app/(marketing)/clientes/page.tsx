import styles from '../marketing.module.css';

export const metadata = {
  title: 'Clientes | Recursalia',
  description: 'Organizaciones que confían en Recursalia.',
};

export default function ClientesPage() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2>Nuestros clientes</h2>
        <p className={styles.empty}>
          Pronto publicaremos casos y testimonios. Si quieres hablar con el equipo, escribe a
          hola@recursalia.com.
        </p>
      </div>
    </section>
  );
}
