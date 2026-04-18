import type { Metadata } from 'next';
import { InspiracionExperience } from '@/components/marketing/InspiracionExperience';
import styles from '../marketing.module.css';

export const metadata: Metadata = {
  title: 'Inspiración | Recursalia',
  description:
    'Descubre cursos recomendados según tus aficiones, disponibilidad y nivel. Experiencia guiada y personalizada.',
};

export default function InspiracionPage() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <InspiracionExperience />
      </div>
    </section>
  );
}
