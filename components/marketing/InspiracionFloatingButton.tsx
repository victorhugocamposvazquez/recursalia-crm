'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isMarketingCourseLandingPath } from '@/lib/marketing-path';
import styles from './InspiracionFloatingButton.module.css';

const PULSE_MS = 580;
const ORACLE_SRC = '/images/oracle.png';

/** FAB Neurall: recurso marca (`public/images/oracle.png`). */
export function InspiracionFloatingButton() {
  const pathname = usePathname();
  const [pulse, setPulse] = useState(false);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerPulse = useCallback(() => {
    setPulse(true);
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = setTimeout(() => {
      pulseTimerRef.current = null;
      setPulse(false);
    }, PULSE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, []);

  const isInspiracion = pathname === '/inspiracion';
  const isCourseLanding = isMarketingCourseLandingPath(pathname);
  if (isInspiracion || isCourseLanding) return null;

  return (
    <Link
      href="/inspiracion"
      className={`${styles.dock} ${pulse ? styles.dockPulse : ''}`.trim()}
      aria-label="Abrir Inspiración con Neurall"
      onMouseEnter={triggerPulse}
      onFocus={triggerPulse}
    >
      <span className={styles.glyph}>
        <Image
          src={ORACLE_SRC}
          alt=""
          width={144}
          height={144}
          className={styles.glyphImg}
          sizes="54px"
        />
      </span>
    </Link>
  );
}
