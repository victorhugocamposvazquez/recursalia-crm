'use client';
// components/learn/tokens.tsx
// Tokens de diseño, hook de tema y primitivos UI compartidos.
// Importa esto desde cualquier componente del módulo Learn.

import React from 'react';
import type { AccentKey, TweakOptions } from './types';

// ── PALETA DE ACENTOS ──────────────────────────────────────────────────────
export const accentMap: Record<AccentKey, { bg: string; fg: string; soft: string; name: string }> = {
  lime:   { bg: '#C8F542', fg: '#0A0A14', soft: '#EDFBC2', name: 'Lima' },
  blue:   { bg: '#1b38c4', fg: '#FFFFFF', soft: '#DCDFFF', name: 'Azul' },
  coral:  { bg: '#FF6B4A', fg: '#FFFFFF', soft: '#FFD7CD', name: 'Coral' },
  violet: { bg: '#7A5AE0', fg: '#FFFFFF', soft: '#E1D8FF', name: 'Violeta' },
};

// ── HOOK DE TEMA ───────────────────────────────────────────────────────────
// Centraliza todas las variables visuales para light/dark + acento.
export interface Theme {
  dark: boolean;
  accent: AccentKey;
  A: { bg: string; fg: string; soft: string; name: string };
  brand: string;
  brandSoft: string;
  brandInk: string;
  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  muted: string;
  faint: string;
  line: string;
  lineSoft: string;
  sans: string;
  mono: string;
  serif: string;
}

export function useTheme(opts: TweakOptions = {}): Theme {
  const { dark = false, accent = 'lime' } = opts;
  const A = accentMap[accent] || accentMap.lime;
  return {
    dark,
    accent,
    A,
    brand:     '#1b38c4',
    brandSoft: dark ? 'rgba(27,56,196,0.18)' : 'rgba(27,56,196,0.10)',
    brandInk:  dark ? '#A8B5FF' : '#1b38c4',
    bg:        dark ? '#0A0A14' : '#F4F4F0',
    surface:   dark ? '#13131F' : '#FFFFFF',
    surface2:  dark ? '#1B1B2A' : '#FAFAF5',
    ink:       dark ? '#F4F4F0' : '#0A0A14',
    muted:     dark ? '#9293A8' : '#6B6B7A',
    faint:     dark ? '#5A5B70' : '#A8A8B5',
    line:      dark ? 'rgba(255,255,255,0.10)' : 'rgba(10,10,20,0.10)',
    lineSoft:  dark ? 'rgba(255,255,255,0.05)' : 'rgba(10,10,20,0.05)',
    sans:      "'Plus Jakarta Sans', system-ui, sans-serif",
    mono:      "'JetBrains Mono', ui-monospace, monospace",
    serif:     "'Fraunces', 'Times New Roman', serif",
  };
}

// ── LOGO ───────────────────────────────────────────────────────────────────
interface LogoProps {
  size?: number;
  color?: string;
  withText?: boolean;
  textColor?: string;
}
export function Logo({ size = 28, color, withText = true, textColor }: LogoProps) {
  const c = color || 'currentColor';
  const r = 32, cx = 40, cy = 40;
  const v: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    v.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 80 80">
        <path d={`M${v.map((p) => p.join(',')).join(' L')} Z`} stroke={c} strokeWidth={4.5} fill="none" strokeLinejoin="round" />
        <path d="M26 36 Q40 30 54 36" stroke={c} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M26 42 L40 52 L54 42" stroke={c} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {withText && (
        <div
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: Math.round(size * 0.62),
            color: textColor || c,
            letterSpacing: -0.4,
            lineHeight: 1,
          }}
        >
          Recursalia
        </div>
      )}
    </div>
  );
}

// ── ICONOS ─────────────────────────────────────────────────────────────────
// Set propio en SVG inline para evitar dependencia externa. Los nombres
// coinciden con lucide-react, así que puedes migrar sin cambiar llamadas:
//   import { Play, Lock, Check } from 'lucide-react';
//   <Play size={18}/>
// y eliminar este componente.
type IconName =
  | 'play' | 'lock' | 'check' | 'checkCircle' | 'circle'
  | 'chevR' | 'chevL' | 'chevD' | 'chevU'
  | 'bookmark' | 'bolt' | 'flame' | 'star'
  | 'headphones' | 'doc' | 'download' | 'share' | 'linkedin'
  | 'clock' | 'sparkle' | 'menu' | 'x'
  | 'heart' | 'heartFill' | 'trophy' | 'target'
  | 'mute' | 'sound' | 'arrowR' | 'arrowL'
  | 'pause' | 'camera' | 'grid' | 'fire' | 'shield';

interface IconProps {
  name: IconName;
  size?: number;
  sw?: number;
}

export function Icon({ name, size = 18, sw = 1.8 }: IconProps) {
  const p = {
    stroke: 'currentColor',
    strokeWidth: sw,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  const paths: Record<IconName, React.ReactNode> = {
    play: <polygon points="6,4 20,12 6,20" fill="currentColor" stroke="none" />,
    lock: <><rect x="5" y="11" width="14" height="9" rx="2" {...p} /><path d="M8 11V8a4 4 0 0 1 8 0v3" {...p} /></>,
    check: <polyline points="4,12 10,18 20,6" {...p} />,
    checkCircle: <><circle cx="12" cy="12" r="9" {...p} /><polyline points="8,12 11,15 16,9" {...p} /></>,
    circle: <circle cx="12" cy="12" r="9" {...p} />,
    chevR: <polyline points="9,5 16,12 9,19" {...p} />,
    chevL: <polyline points="15,5 8,12 15,19" {...p} />,
    chevD: <polyline points="5,9 12,16 19,9" {...p} />,
    chevU: <polyline points="5,15 12,8 19,15" {...p} />,
    bookmark: <path d="M6 4h12v17l-6-4-6 4z" {...p} />,
    bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" {...p} />,
    flame: <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 1-9z" {...p} />,
    star: <polygon points="12,3 14.6,9 21,9.5 16,13.5 17.7,20 12,16.5 6.3,20 8,13.5 3,9.5 9.4,9" {...p} />,
    headphones: <><path d="M4 14a8 8 0 0 1 16 0" {...p} /><rect x="3" y="14" width="5" height="7" rx="1.5" {...p} /><rect x="16" y="14" width="5" height="7" rx="1.5" {...p} /></>,
    doc: <><path d="M7 3h8l4 4v14H7z" {...p} /><path d="M15 3v4h4" {...p} /></>,
    download: <><path d="M12 3v13" {...p} /><polyline points="6,11 12,17 18,11" {...p} /><line x1="4" y1="20" x2="20" y2="20" {...p} /></>,
    share: <><circle cx="6" cy="12" r="2.5" {...p} /><circle cx="18" cy="6" r="2.5" {...p} /><circle cx="18" cy="18" r="2.5" {...p} /><line x1="8.2" y1="11" x2="15.8" y2="7" {...p} /><line x1="8.2" y1="13" x2="15.8" y2="17" {...p} /></>,
    linkedin: <><rect x="3" y="3" width="18" height="18" rx="3" {...p} /><line x1="7" y1="10" x2="7" y2="17" {...p} /><circle cx="7" cy="7.2" r=".6" fill="currentColor" stroke="none" /><path d="M11 17v-4a3 3 0 0 1 6 0v4" {...p} /><line x1="11" y1="10" x2="11" y2="17" {...p} /></>,
    clock: <><circle cx="12" cy="12" r="9" {...p} /><polyline points="12,7 12,12 15,14" {...p} /></>,
    sparkle: <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z" {...p} />,
    menu: <><line x1="4" y1="7" x2="20" y2="7" {...p} /><line x1="4" y1="12" x2="20" y2="12" {...p} /><line x1="4" y1="17" x2="20" y2="17" {...p} /></>,
    x: <><line x1="6" y1="6" x2="18" y2="18" {...p} /><line x1="18" y1="6" x2="6" y2="18" {...p} /></>,
    heart: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" {...p} />,
    heartFill: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" fill="currentColor" stroke="none" />,
    trophy: <><path d="M7 4h10v4a5 5 0 0 1-10 0z" {...p} /><path d="M7 6H4v2a3 3 0 0 0 3 3" {...p} /><path d="M17 6h3v2a3 3 0 0 1-3 3" {...p} /><path d="M9 20h6M12 14v6" {...p} /></>,
    target: <><circle cx="12" cy="12" r="9" {...p} /><circle cx="12" cy="12" r="5" {...p} /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /></>,
    mute: <><polygon points="4,9 8,9 12,5 12,19 8,15 4,15" fill="currentColor" stroke="none" /><line x1="16" y1="9" x2="20" y2="13" {...p} /><line x1="20" y1="9" x2="16" y2="13" {...p} /></>,
    sound: <><polygon points="4,9 8,9 12,5 12,19 8,15 4,15" fill="currentColor" stroke="none" /><path d="M16 9a4 4 0 0 1 0 6" {...p} /></>,
    arrowR: <><line x1="4" y1="12" x2="20" y2="12" {...p} /><polyline points="14,6 20,12 14,18" {...p} /></>,
    arrowL: <><line x1="20" y1="12" x2="4" y2="12" {...p} /><polyline points="10,6 4,12 10,18" {...p} /></>,
    pause: <><rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none" /><rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none" /></>,
    camera: <><path d="M3 7h4l2-3h6l2 3h4v13H3z" {...p} /><circle cx="12" cy="13" r="4" {...p} /></>,
    grid: <><rect x="4" y="4" width="7" height="7" {...p} /><rect x="13" y="4" width="7" height="7" {...p} /><rect x="4" y="13" width="7" height="7" {...p} /><rect x="13" y="13" width="7" height="7" {...p} /></>,
    fire: <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 1-9z" fill="currentColor" stroke="none" />,
    shield: <path d="M12 3 4 6v6c0 4.5 3.5 8 8 9 4.5-1 8-4.5 8-9V6z" {...p} />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      {paths[name] || paths.circle}
    </svg>
  );
}

// ── BOTÓN ──────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  bg?: string;
  fg?: string;
  kind?: 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  iconRight?: IconName;
}

export function Button({
  children, bg, fg, kind = 'primary', size = 'md', icon, iconRight, style, disabled, ...rest
}: ButtonProps) {
  const sizes = {
    sm: { pad: '8px 14px',  fs: 13, ic: 14 },
    md: { pad: '12px 20px', fs: 14, ic: 16 },
    lg: { pad: '16px 28px', fs: 16, ic: 18 },
  }[size];
  const isPrimary = kind === 'primary';
  const isGhost = kind === 'ghost';
  return (
    <button
      disabled={disabled}
      {...rest}
      style={{
        appearance: 'none',
        border: isGhost ? '1.5px solid currentColor' : 'none',
        background: isPrimary ? (bg || '#0A0A14') : 'transparent',
        color: isPrimary ? (fg || '#FFF') : 'currentColor',
        padding: sizes.pad,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 600,
        fontSize: sizes.fs,
        letterSpacing: -0.2,
        borderRadius: 999,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        opacity: disabled ? 0.5 : 1,
        transition: 'transform .12s ease, box-shadow .12s ease',
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={sizes.ic} />}
      <span>{children}</span>
      {iconRight && <Icon name={iconRight} size={sizes.ic} />}
    </button>
  );
}

// ── PROGRESS ───────────────────────────────────────────────────────────────
interface ProgressProps {
  value: number;
  max?: number;
  color?: string;
  track?: string;
  height?: number;
  style?: React.CSSProperties;
}
export function Progress({ value, max = 1, color, track, height = 6, style }: ProgressProps) {
  const pct = Math.max(0, Math.min(1, value / max)) * 100;
  return (
    <div style={{ width: '100%', height, background: track || 'rgba(10,10,20,0.08)', borderRadius: height, overflow: 'hidden', ...style }}>
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: color || '#1b38c4',
          borderRadius: height,
          transition: 'width .4s cubic-bezier(.2,.7,.2,1)',
        }}
      />
    </div>
  );
}

// ── CHIP ───────────────────────────────────────────────────────────────────
interface ChipProps {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  border?: string;
  size?: 'sm' | 'md';
  mono?: boolean;
  icon?: IconName;
  style?: React.CSSProperties;
}
export function Chip({ children, color, bg, border, size = 'md', mono, icon, style }: ChipProps) {
  const sz = size === 'sm' ? { p: '4px 9px', fs: 11, ic: 12 } : { p: '6px 11px', fs: 12, ic: 13 };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: sz.p,
        fontSize: sz.fs,
        fontWeight: 600,
        background: bg || 'transparent',
        color: color || 'currentColor',
        border: border || 'none',
        borderRadius: 999,
        lineHeight: 1,
        fontFamily: mono ? "'JetBrains Mono', monospace" : "'Plus Jakarta Sans', sans-serif",
        letterSpacing: mono ? 0.4 : -0.1,
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={sz.ic} />}
      {children}
    </span>
  );
}

// ── HELPER MONO (etiquetas técnicas) ───────────────────────────────────────
export function Mono({
  children, color, size = 11, style,
}: { children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }) {
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: size,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        color,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ── UTILS ──────────────────────────────────────────────────────────────────
export const fmt = {
  n: (n: number) => new Intl.NumberFormat('es-ES').format(n),
};
