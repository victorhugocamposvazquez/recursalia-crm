/** Icono SVG del FAB Neurall: brújula + acento lime (marca «brújula inteligente»). */
export function NeurallFabIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Destellos discretos */}
      <circle cx="38" cy="12" r="2.2" fill="#d8ff5c" opacity={0.92} />
      <circle cx="40" cy="22" r="1.35" fill="#c8f542" opacity={0.75} />
      <path
        d="M11 14 L13 17 L10 17 Z"
        fill="#c8f542"
        opacity={0.55}
      />

      {/* Rosa */}
      <circle
        cx="24"
        cy="26"
        r="17"
        stroke="#0f172a"
        strokeWidth={1.65}
      />
      {/* Marcas cardinales */}
      <path d="M24 11 v3 M37 26 h-3 M24 41 v-3 M14 26 h3" stroke="#0f172a" strokeWidth={1.35} strokeLinecap="round" />
      {/* Secundarias */}
      <path
        d="M31 13.5 L29.8 15.7 M31 38.5 L29.8 36.3 M9 26 L11.8 26 M41 26 L38.2 26"
        stroke="#64748b"
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.65}
      />

      {/* Aguja: norte lime, sur frío */}
      <path d="M24 26 L24 13 L29 26 Z" fill="#c8f542" stroke="#0f172a" strokeWidth={0.85} strokeLinejoin="round" />
      <path d="M24 26 L24 39 L19 26 Z" fill="#94a3b8" stroke="#0f172a" strokeWidth={0.85} strokeLinejoin="round" />

      {/* Centro */}
      <circle cx="24" cy="26" r="3.2" fill="#ffffff" stroke="#0f172a" strokeWidth={1.2} />
      <circle cx="24" cy="26" r="1.35" fill="#0f172a" />
    </svg>
  );
}
