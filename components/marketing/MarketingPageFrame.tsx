'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import styles from '@/app/(marketing)/marketing.module.css';
import { InspiracionFloatingButton } from './InspiracionFloatingButton';

type Props = {
  className: string;
  header: ReactNode;
  main: ReactNode;
  footer: ReactNode;
};

/**
 * Ajustes de layout por ruta: en Inspiración el fondo es el azul Neurall a pantalla completa y se oculta el footer.
 * En las demás rutas marketing (excepto fichas de curso) montamos un
 * botón flotante con el oráculo Neurall que lleva a /inspiracion.
 */
export function MarketingPageFrame({ className, header, main, footer }: Props) {
  const pathname = usePathname();
  const isInspiracion = pathname === '/inspiracion';

  return (
    <div
      className={`${className} ${isInspiracion ? styles.marketingInspiracion : ''}`.trim()}
      data-inspiracion={isInspiracion ? 'true' : undefined}
    >
      {header}
      {main}
      {!isInspiracion ? footer : null}
      <InspiracionFloatingButton />
    </div>
  );
}
