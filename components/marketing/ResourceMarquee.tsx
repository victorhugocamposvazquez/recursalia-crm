import Image from 'next/image';
import styles from './ResourceMarquee.module.css';

type Variant = 'sm' | 'md' | 'lg' | 'portrait' | 'square';

type Card = {
  src: string;
  alt: string;
  variant: Variant;
};

const ROW_A: Card[] = [
  { src: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=720&q=70', alt: 'Formación en equipo', variant: 'md' },
  { src: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=480&q=70', alt: 'Aprendizaje digital', variant: 'portrait' },
  { src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=70', alt: 'Cultura colaborativa', variant: 'lg' },
  { src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=520&q=70', alt: 'Equipo creativo', variant: 'square' },
  { src: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=720&q=70', alt: 'Onboarding', variant: 'md' },
  { src: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=480&q=70', alt: 'Managers', variant: 'sm' },
  { src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=860&q=70', alt: 'Reporte y analítica', variant: 'lg' },
  { src: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=520&q=70', alt: 'Workshop', variant: 'portrait' },
  { src: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=520&q=70', alt: 'Formación continua', variant: 'square' },
  { src: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=720&q=70', alt: 'Liderazgo', variant: 'md' },
];

const ROW_B: Card[] = [
  { src: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=860&q=70', alt: 'Cultura de feedback', variant: 'lg' },
  { src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=520&q=70', alt: 'Hábitos de trabajo', variant: 'square' },
  { src: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=480&q=70', alt: 'Reuniones 1 a 1', variant: 'portrait' },
  { src: 'https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=720&q=70', alt: 'Equipos remotos', variant: 'md' },
  { src: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=480&q=70', alt: 'Planificación estratégica', variant: 'sm' },
  { src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=70', alt: 'Brainstorming', variant: 'lg' },
  { src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=520&q=70', alt: 'Charla interna', variant: 'portrait' },
  { src: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=720&q=70', alt: 'Work hub', variant: 'md' },
  { src: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=520&q=70', alt: 'Lectura concentrada', variant: 'square' },
  { src: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=860&q=70', alt: 'Pizarra', variant: 'lg' },
];

function variantClass(v: Variant) {
  if (v === 'sm') return styles.cardSm;
  if (v === 'lg') return styles.cardLg;
  if (v === 'portrait') return styles.cardPortrait;
  if (v === 'square') return styles.cardSquare;
  return styles.cardMd;
}

function MarqueeRow({
  items,
  reverse = false,
  speed = 60,
}: {
  items: Card[];
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
          <div
            key={`${item.alt}-${idx}`}
            className={`${styles.card} ${variantClass(item.variant)}`}
            aria-hidden={idx >= items.length}
          >
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
      <MarqueeRow items={ROW_A} speed={70} />
      <MarqueeRow items={ROW_B} reverse speed={85} />
    </div>
  );
}
