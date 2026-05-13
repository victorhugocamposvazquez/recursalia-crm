'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NeurallFabIcon } from '@/components/marketing/NeurallFabIcon';
import { isMarketingCourseLandingPath } from '@/lib/marketing-path';
import styles from './InspiracionFloatingButton.module.css';

const PULSE_MS = 580;

/** FAB Neurall: icono brújula legible + disco lime (sin canvas). */
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
      <NeurallFabIcon className={styles.glyph} />
    </Link>
  );
}
