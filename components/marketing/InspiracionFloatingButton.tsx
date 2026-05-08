'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ParticleOracle, {
  type ParticleOracleHandle,
} from '@/components/marketing/inspiracion/ParticleOracle';
import { isMarketingCourseLandingPath } from '@/lib/marketing-path';
import styles from './InspiracionFloatingButton.module.css';

/**
 * Botón flotante (fixed bottom-right) que lleva a /inspiracion.
 * Se oculta en la propia página de inspiración y en las fichas de curso
 * (donde el usuario está concentrado en el checkout y no queremos
 * distracciones).
 */
export function InspiracionFloatingButton() {
  const pathname = usePathname();
  const oracleRef = useRef<ParticleOracleHandle | null>(null);
  const [oracleSize, setOracleSize] = useState(52);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const compute = () => {
      const w = window.innerWidth;
      setOracleSize(w >= 768 ? 64 : 52);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const isInspiracion = pathname === '/inspiracion';
  const isCourseLanding = isMarketingCourseLandingPath(pathname);
  if (isInspiracion || isCourseLanding) return null;

  return (
    <div className={styles.dock} aria-hidden={false}>
      <Link
        href="/inspiracion"
        className={styles.btn}
        aria-label="Inspírate con Neurall"
        onMouseEnter={() => oracleRef.current?.pulse()}
        onFocus={() => oracleRef.current?.pulse()}
      >
        <span className={styles.glow} aria-hidden />
        <span className={styles.orb} aria-hidden>
          <ParticleOracle
            ref={oracleRef}
            size={oracleSize}
            bodyCount={520}
            haloCount={180}
          />
        </span>
        <span className={styles.label}>
          <span className={styles.labelKicker}>Inspírate</span>
          <span className={styles.labelStrong}>con Neurall</span>
        </span>
      </Link>
    </div>
  );
}
