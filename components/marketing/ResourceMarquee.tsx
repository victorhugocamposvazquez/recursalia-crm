import Image from 'next/image';
import styles from './ResourceMarquee.module.css';

const ROW_A = [
  { src: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=640&q=70', alt: 'Formación en equipo' },
  { src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=640&q=70', alt: 'Cultura colaborativa' },
  { src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=640&q=70', alt: 'Equipo creativo' },
  { src: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=640&q=70', alt: 'Onboarding' },
  { src: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=640&q=70', alt: 'Managers' },
  { src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=640&q=70', alt: 'Reporte y analítica' },
  { src: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=640&q=70', alt: 'Workshop' },
  { src: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=640&q=70', alt: 'Aprendizaje digital' },
];

const ROW_B = [
  { src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=640&q=70', alt: 'Hábitos de trabajo' },
  { src: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=640&q=70', alt: 'Reuniones 1 a 1' },
  { src: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=640&q=70', alt: 'Cultura de feedback' },
  { src: 'https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=640&q=70', alt: 'Equipos remotos' },
  { src: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=640&q=70', alt: 'Liderazgo' },
  { src: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=640&q=70', alt: 'Formación continua' },
  { src: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=640&q=70', alt: 'Planificación estratégica' },
  { src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=640&q=70', alt: 'Brainstorming' },
];

function MarqueeRow({
  items,
  reverse = false,
  speed = 60,
}: {
  items: { src: string; alt: string }[];
  reverse?: boolean;
  speed?: number;
}) {
  const rendered = [...items, ...items];
  return (
    <div className={styles.rowViewport}>
      <div
        className={`${styles.track} ${reverse ? styles.trackReverse : ''}`}
        style={{ ['--marquee-duration' as string]: `${speed}s` }}
      >
        {rendered.map((item, idx) => (
          <div key={`${item.alt}-${idx}`} className={styles.card} aria-hidden={idx >= items.length}>
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes="(max-width: 640px) 40vw, (max-width: 1024px) 25vw, 18vw"
              className={styles.img}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResourceMarquee() {
  return (
    <div className={styles.wrap} aria-hidden>
      <MarqueeRow items={ROW_A} speed={65} />
      <MarqueeRow items={ROW_B} reverse speed={75} />
    </div>
  );
}
