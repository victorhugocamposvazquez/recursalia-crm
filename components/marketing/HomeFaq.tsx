'use client';

import { useState } from 'react';
import styles from './HomeFaq.module.css';

type FaqItem = {
  question: string;
  answer: string;
};

const FAQS: FaqItem[] = [
  {
    question: '¿Cómo accedo al curso después de comprarlo?',
    answer:
      'En cuanto completas el pago en Hotmart recibes un correo con tus datos de acceso. Inicia sesión y empieza a aprender en menos de un minuto, desde cualquier dispositivo.',
  },
  {
    question: '¿De verdad hay 7 días de garantía?',
    answer:
      'Sí. Hotmart aplica una política de devolución de 7 días desde la compra. Si el curso no es para ti, te devolvemos el 100% del importe sin trámites complicados.',
  },
  {
    question: '¿El acceso al curso caduca?',
    answer:
      'No. Compras el curso una sola vez y lo conservas de por vida, incluyendo las actualizaciones futuras del temario.',
  },
  {
    question: '¿Recibo un diploma al terminar?',
    answer:
      'Sí. Al finalizar todas las lecciones recibes un diploma personalizado con tu nombre y un código de verificación que puedes compartir en LinkedIn o con empresas.',
  },
  {
    question: '¿Hay bolsa de empleo incluida?',
    answer:
      'Los cursos marcados con bolsa de trabajo dan acceso a oportunidades reales con empresas colaboradoras una vez completas la formación.',
  },
  {
    question: '¿Puedo pagar a plazos?',
    answer:
      'Sí. Hotmart permite pagar en cuotas con tarjeta. El número de cuotas disponibles aparece en el momento del pago según tu país y banco.',
  },
  {
    question: '¿Quién imparte los cursos?',
    answer:
      'Los temarios están creados y auditados por el equipo experto de Recursalia, junto con profesionales en activo de cada sector. Cada ficha incluye más detalle del autor.',
  },
];

export function HomeFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <ul className={styles.list}>
      {FAQS.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <li
            key={item.question}
            className={`${styles.item} ${isOpen ? styles.itemOpen : ''}`}
          >
            <button
              type="button"
              className={styles.trigger}
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : idx)}
            >
              <span className={styles.question}>
                <span>{item.question}</span>
              </span>
              <span
                className={`${styles.toggle} ${isOpen ? styles.toggleOpen : ''}`}
                aria-hidden
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </button>
            {isOpen ? (
              <div className={styles.panel}>
                <p>{item.answer}</p>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
