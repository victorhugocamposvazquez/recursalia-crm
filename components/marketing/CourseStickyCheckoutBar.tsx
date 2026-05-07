'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { StarRatingDisplay } from './StarRatingDisplay';
import styles from './CourseStickyCheckoutBar.module.css';

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0021 4H5.21L4.27 2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );
}

/** Poco scroll: la barra es el CTA principal móvil; debe aparecer pronto */
const SCROLL_SHOW_PX = 72;

function CheckoutCta({
  hotmartUrl,
  className,
}: {
  hotmartUrl: string | null;
  className: string;
}) {
  if (!hotmartUrl) {
    return (
      <span className={`${className} ${styles.ctaPending}`} aria-disabled="true">
        <CartIcon className={styles.ctaCart} />
        <span className={styles.ctaText}>Enlace pendiente</span>
      </span>
    );
  }
  return (
    <a
      className={className}
      href={hotmartUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      <CartIcon className={styles.ctaCart} />
      <span className={styles.ctaText}>Comprar ahora</span>
    </a>
  );
}

export type CourseStickyCheckoutBarProps = {
  title: string;
  /** URL Hotmart completa o null si aún no hay enlace guardado */
  hotmartUrl: string | null;
  displayPriceLabel: string;
  originalPriceLabel?: string | null;
  showStrike: boolean;
  /** Si hay opiniones, mostramos resumen en la barra (refuerza CTA). */
  ratingAverage?: number | null;
  reviewCount?: number;
};

export function CourseStickyCheckoutBar({
  title,
  hotmartUrl,
  displayPriceLabel,
  originalPriceLabel,
  showStrike,
  ratingAverage,
  reviewCount = 0,
}: CourseStickyCheckoutBarProps) {
  const [revealed, setRevealed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const tick = () => setRevealed(window.scrollY > SCROLL_SHOW_PX);
    tick();
    window.addEventListener('scroll', tick, { passive: true });
    return () => window.removeEventListener('scroll', tick);
  }, []);

  const scrollTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const shell = (
    <div
      className={`${styles.root} ${revealed ? styles.rootVisible : ''}`}
      role="region"
      aria-label="Resumen de compra"
      aria-hidden={!revealed}
    >
      <div className={styles.inner}>
        <div className={styles.desktopHead}>
          <p className={styles.courseTitle}>{title}</p>
          {ratingAverage != null && reviewCount > 0 ? (
            <div className={styles.headRating} aria-label="Valoración del curso">
              <span className={styles.headScore}>
                {ratingAverage.toFixed(1).replace('.', ',')}
              </span>
              <StarRatingDisplay value={ratingAverage} ariaHidden />
              <span className={styles.headCount}>({reviewCount})</span>
            </div>
          ) : null}
        </div>

        <div className={styles.desktopActions}>
          <div className={styles.priceCluster}>
            {showStrike && originalPriceLabel && (
              <span className={styles.was}>{originalPriceLabel}</span>
            )}
            <span className={styles.now}>{displayPriceLabel}</span>
          </div>

          <CheckoutCta hotmartUrl={hotmartUrl} className={styles.cta} />

          <p className={styles.trustInline}>
            <span className={styles.lock} aria-hidden>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#c9a227">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
            </span>
            Pago seguro con Hotmart, garantía de devolución
          </p>

          <button
            type="button"
            className={styles.toTop}
            aria-label="Volver arriba"
            onClick={scrollTop}
          >
            <svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              aria-hidden
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="currentColor" d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>

        <div className={styles.mobileRow}>
          <div className={styles.priceCluster}>
            {showStrike && originalPriceLabel && (
              <span className={styles.was}>{originalPriceLabel}</span>
            )}
            <span className={styles.now}>{displayPriceLabel}</span>
          </div>
          <CheckoutCta hotmartUrl={hotmartUrl} className={styles.cta} />
        </div>

        <p className={styles.trustMobile}>
          <span className={styles.lock} aria-hidden>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#c9a227">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
          </span>
          Pago seguro con Hotmart, garantía de devolución
        </p>
      </div>
    </div>
  );

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(shell, document.body);
}
