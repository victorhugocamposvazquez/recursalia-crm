/** Icono tipo Safari: escuadra redondeada + brújula azul (aguja NE / dial fino). */
export function NeurallFabIcon({ className }: { className?: string }) {
  const cx = 24;
  const cy = 24;
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const deg = i * 10 - 90;
    const rad = (deg * Math.PI) / 180;
    const major = i % 9 === 0;
    const r1 = major ? 9.8 : 11.2;
    const r2 = major ? 16.4 : 14.6;
    const x1 = cx + r1 * Math.cos(rad);
    const y1 = cy + r1 * Math.sin(rad);
    const x2 = cx + r2 * Math.cos(rad);
    const y2 = cy + r2 * Math.sin(rad);
    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={major ? '#1b38c4' : '#94a3b8'}
        strokeWidth={major ? 1.05 : 0.4}
        strokeLinecap="round"
      />
    );
  });

  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="neurallSafariFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#f4f8ff" />
          <stop offset="100%" stopColor="#e4ecfc" />
        </linearGradient>
        <linearGradient id="neurallNeedleN" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#1634a8" />
          <stop offset="100%" stopColor="#3d6bff" />
        </linearGradient>
      </defs>

      {/* Cara tipo app Safari */}
      <rect
        x="3.25"
        y="3.25"
        width="41.5"
        height="41.5"
        rx="11.25"
        ry="11.25"
        fill="url(#neurallSafariFace)"
        stroke="#1b38c4"
        strokeWidth={1.35}
      />
      <rect
        x="5.25"
        y="5.25"
        width="37.5"
        height="37.5"
        rx="9"
        ry="9"
        stroke="#ffffff"
        strokeOpacity={0.55}
        strokeWidth={0.55}
      />

      {/* Dial */}
      <circle cx={cx} cy={cy} r="17.25" fill="#fbfcff" stroke="#cbd5e9" strokeWidth={0.65} />
      <g>{ticks}</g>

      {/* Aguja (estilo Safari: norte saturado, sur claro) */}
      <path
        d="M24 24 L24 9 L29 24 Z"
        fill="url(#neurallNeedleN)"
        stroke="#102080"
        strokeWidth={0.55}
        strokeLinejoin="round"
      />
      <path
        d="M24 24 L24 39 L19 24 Z"
        fill="#dbe8ff"
        stroke="#64748b"
        strokeWidth={0.55}
        strokeLinejoin="round"
      />

      <circle cx={cx} cy={cy} r="3.35" fill="#ffffff" stroke="#1b38c4" strokeWidth={1.05} />
      <circle cx={cx} cy={cy} r="1.2" fill="#1b38c4" />
    </svg>
  );
}
