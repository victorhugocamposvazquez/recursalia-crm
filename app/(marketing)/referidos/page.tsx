import styles from '../marketing.module.css';

export const metadata = {
  title: 'Referidos | Recursalia',
  description: 'Programa de referidos Recursalia.',
};

export default function ReferidosPage() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2>Referidos</h2>
        <p className={styles.empty}>
          El programa de referidos estará disponible pronto. Si quieres colaborar con nosotros,
          escribe a hola@recursalia.com.
        </p>
      </div>
    </section>
  );
}
