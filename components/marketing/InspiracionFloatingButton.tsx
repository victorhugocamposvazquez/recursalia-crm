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
 * (donde el usuario está en el flujo de checkout y no queremos distraer).
 *
 * No lleva fondo ni pill: es solo el orbe animado de partículas.
 */
export function InspiracionFloatingButton() {
  const pathname = usePathname();
  const oracleRef = useRef<ParticleOracleHandle | null>(null);
  const [oracleSize, setOracleSize] = useState(64);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const compute = () => {
      const w = window.innerWidth;
      setOracleSize(w >= 768 ? 84 : 64);
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
        bodyCount={520}
        haloCount={180}
      />
    </Link>
  );
}
