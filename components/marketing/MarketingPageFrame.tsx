'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import styles from '@/app/(marketing)/marketing.module.css';

type Props = {
  className: string;
  header: ReactNode;
  main: ReactNode;
  footer: ReactNode;
};

/**
 * Ajustes de layout por ruta: en Inspiración el fondo es el azul Neurall a pantalla completa y se oculta el footer.
 */
export function MarketingPageFrame({ className, header, main, footer }: Props) {
  const pathname = usePathname();
  const isInspiracion = pathname === '/inspiracion';

  return (
    <div
      className={`${className} ${isInspiracion ? styles.marketingInspiracion : ''}`.trim()}
      data-inspiracion={isInspiracion ? 'true' : undefined}
    >
      {!isInspiracion ? header : null}
      {main}
      {!isInspiracion ? footer : null}
    </div>
  );
}
