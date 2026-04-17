'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import styles from './TextGenerateEffect.module.css';

type Props = {
  words: string;
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
};

export function TextGenerateEffect({
  words,
  className,
  delay = 0,
  duration = 0.55,
  stagger = 0.08,
}: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [active, setActive] = useState(false);
  const wordsArray = words.split(' ');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: '-10% 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className={`${styles.root}${className ? ` ${className}` : ''}`}>
      {wordsArray.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className={styles.word}
          style={
            active
              ? ({
                  ['--word-index' as string]: index,
                  ['--start-delay' as string]: `${delay}s`,
                  ['--word-duration' as string]: `${duration}s`,
                  ['--word-stagger' as string]: `${stagger}s`,
                } as CSSProperties)
              : ({ opacity: 0 } as CSSProperties)
          }
        >
          {word}
          {index < wordsArray.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </span>
  );
}
