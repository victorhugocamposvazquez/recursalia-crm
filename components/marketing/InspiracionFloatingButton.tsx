'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isMarketingCourseLandingPath } from '@/lib/marketing-path';
import styles from './InspiracionFloatingButton.module.css';

const PULSE_MS = 580;

/** FAB Neurall: disco azul + anillo fluor fino tipo IG (hueco entre anillo y disco). */
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
      <span className={styles.storyRing}>
        <span className={styles.storyInner}>
          <span className={styles.storyGap}>
            <span className={styles.storyCore} aria-hidden />
          </span>
        </span>
      </span>
    </Link>
  );
}
