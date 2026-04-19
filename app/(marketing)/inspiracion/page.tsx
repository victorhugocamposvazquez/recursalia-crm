import type { Metadata } from 'next';
import { InspiracionExperience } from '@/components/marketing/InspiracionExperience';
import pageStyles from './inspiracion-page.module.css';

export const metadata: Metadata = {
  title: 'Inspiración | Recursalia',
  description:
    'Cuatro pasos para orientar tu formación: intereses, tiempo, punto de partida y objetivo. Experiencia guiada.',
};

export default function InspiracionPage() {
  return (
    <section className={pageStyles.wrap}>
      <InspiracionExperience />
    </section>
  );
}
