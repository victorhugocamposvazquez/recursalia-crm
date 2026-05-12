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
 * Botón flotante compacto: disco opaco detrás del canvas para que no se vea
 * “fantasma” sobre fondos claros.
 */
export function InspiracionFloatingButton() {
  const pathname = usePathname();
  const oracleRef = useRef<ParticleOracleHandle | null>(null);
  const [oracleSize, setOracleSize] = useState(58);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const compute = () => {
      const w = window.innerWidth;
      setOracleSize(w >= 768 ? 72 : 58);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const isInspiracion = pathname === '/inspiracion';
  const isCourseLanding = isMarketingCourseLandingPath(pathname);
  if (isInspiracion || isCourseLanding) return null;

  return (
    <Link
      href="/inspiracion"
      className={styles.dock}
      aria-label="Inspírate con Neurall"
      onMouseEnter={() => oracleRef.current?.pulse()}
      onFocus={() => oracleRef.current?.pulse()}
    >
      <ParticleOracle
        ref={oracleRef}
        size={oracleSize}
        bodyCount={420}
        haloCount={150}
      />
    </Link>
  );
}
