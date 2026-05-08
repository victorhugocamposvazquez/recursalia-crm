/**
 * Set de SVGs decorativos en estilo doodle/sketch para la home.
 * Todos usan currentColor: cambia el color con la prop `color` o con el
 * color CSS heredado en el contenedor.
 */

type DoodleProps = {
  className?: string;
  width?: number | string;
  height?: number | string;
  color?: string;
  strokeWidth?: number;
  ariaLabel?: string;
};

function baseProps({ ariaLabel }: { ariaLabel?: string }) {
  return ariaLabel
    ? ({ role: 'img', 'aria-label': ariaLabel } as const)
    : ({ 'aria-hidden': true } as const);
}

/** Subrayado ondulado para resaltar palabras (más natural que un underline recto). */
export function WavyUnderline({
  className,
  width = 220,
  height = 14,
  color = 'currentColor',
  strokeWidth = 3,
  ariaLabel,
}: DoodleProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 14"
      width={width}
      height={height}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      preserveAspectRatio="none"
      {...baseProps({ ariaLabel })}
    >
      <path d="M2 8c10-7 22-7 32 0s22 7 32 0 22-7 32 0 22 7 32 0 22-7 32 0 22 7 32 0" />
    </svg>
  );
}

/** Línea garabato larga, conector entre secciones o pasos. */
export function Squiggle({
  className,
  width = 320,
  height = 22,
  color = 'currentColor',
  strokeWidth = 3,
  ariaLabel,
}: DoodleProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 22"
      width={width}
      height={height}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      preserveAspectRatio="none"
      {...baseProps({ ariaLabel })}
    >
      <path d="M2 11c12-12 28-12 40 0s28 12 40 0 28-12 40 0 28 12 40 0 28-12 40 0 28 12 40 0 28-12 40 0 28 12 38 0" />
    </svg>
  );
}

/** Estrella estilo cómic con 5 puntas irregulares. */
export function Star({
  className,
  width = 36,
  height = 36,
  color = 'currentColor',
  strokeWidth = 2,
  ariaLabel,
}: DoodleProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 36"
      width={width}
      height={height}
      fill={color}
      stroke="#0f172a"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      {...baseProps({ ariaLabel })}
    >
      <path d="M18 3.4 22.5 13l10.5 1.4-7.7 7.1 2 10.7L18 27l-9.3 5.2 2-10.7L3 14.4 13.5 13z" />
    </svg>
  );
}

/** Asterisco de 6 puntas, sello visual. */
export function Asterisk({
  className,
  width = 28,
  height = 28,
  color = 'currentColor',
  strokeWidth = 2.4,
  ariaLabel,
}: DoodleProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 28"
      width={width}
      height={height}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      {...baseProps({ ariaLabel })}
    >
      <path d="M14 3v22" />
      <path d="M3 14h22" />
      <path d="m6 6 16 16" />
      <path d="m22 6-16 16" />
    </svg>
  );
}

/** Espiral abierta, decorativa. */
export function Spiral({
  className,
  width = 36,
  height = 36,
  color = 'currentColor',
  strokeWidth = 2,
  ariaLabel,
}: DoodleProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 36"
      width={width}
      height={height}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...baseProps({ ariaLabel })}
    >
      <path d="M18 18a3 3 0 0 1 3-3 5 5 0 0 1 5 5 7 7 0 0 1-7 7 9 9 0 0 1-9-9 11 11 0 0 1 11-11" />
    </svg>
  );
}

/** Flecha curvada estilo cómic, apunta hacia abajo-derecha por defecto. */
export function ArrowDoodle({
  className,
  width = 90,
  height = 60,
  color = 'currentColor',
  strokeWidth = 2.4,
  ariaLabel,
}: DoodleProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 90 60"
      width={width}
      height={height}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...baseProps({ ariaLabel })}
    >
      <path d="M6 8c20 4 38 18 50 36" />
      <path d="m44 38 12 8 4-13" />
    </svg>
  );
}

/** Estrella de explosión (burst) con muchas púas, tipo "wow!". */
export function BurstStar({
  className,
  width = 60,
  height = 60,
  color = 'currentColor',
  strokeWidth = 2,
  ariaLabel,
}: DoodleProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 60 60"
      width={width}
      height={height}
      fill={color}
      stroke="#0f172a"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      {...baseProps({ ariaLabel })}
    >
      <path d="M30 4l4 9 9-5-2 10 10 2-7 7 7 7-10 2 2 10-9-5-4 9-4-9-9 5 2-10-10-2 7-7-7-7 10-2-2-10 9 5z" />
    </svg>
  );
}

/** Mano puntero estilo dibujado para CatalogMock. */
export function HandPointer({
  className,
  width = 32,
  height = 32,
  color = 'currentColor',
  strokeWidth = 1.8,
  ariaLabel,
}: DoodleProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      width={width}
      height={height}
      fill="#ffffff"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...baseProps({ ariaLabel })}
    >
      <path d="M11 18V8a2 2 0 0 1 4 0v8" />
      <path d="M15 14V6a2 2 0 0 1 4 0v9" />
      <path d="M19 14V8a2 2 0 0 1 4 0v10c0 4-3 8-7 8h-2c-3 0-5-2-6-4l-3-6a2 2 0 0 1 3-3l3 3" />
    </svg>
  );
}

/** Dedo de swipe horizontal con flecha (hint para el carrusel móvil). */
export function SwipeHand({
  className,
  width = 56,
  height = 32,
  color = 'currentColor',
  strokeWidth = 2,
  ariaLabel,
}: DoodleProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 56 32"
      width={width}
      height={height}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...baseProps({ ariaLabel })}
    >
      <circle cx="14" cy="16" r="6" fill="#ffffff" />
      <path d="M22 16h26" />
      <path d="m42 10 6 6-6 6" />
    </svg>
  );
}
