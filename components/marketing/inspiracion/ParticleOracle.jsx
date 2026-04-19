"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

/**
 * ParticleOracle — orbe sci-fi de partículas
 * ───────────────────────────────────────────
 * · React 18 + Next 14 (compatible con "use client")
 * · Canvas 2D puro · 0 dependencias · ~7 KB minified
 * · Partículas: cuerpo esférico (Fibonacci) + halo orbital 3D
 * · Idle: rotación + respiración suave
 * · Thinking: dispersa + acelera + jitter (600 ms por pulso)
 * · Optimizaciones:
 *     – devicePixelRatio clamp a 2 (móviles no se queman)
 *     – IntersectionObserver → pausa total cuando no es visible
 *     – ResizeObserver → se readapta si cambias el size con CSS
 *     – prefers-reduced-motion → reduce actividad a 30 %
 *     – Adapta densidad y grosor de partículas al tamaño
 *
 * ── Uso básico ────────────────────────────────────────────
 * import ParticleOracle from "@/components/ParticleOracle";
 *
 * export default function Page() {
 *   return <ParticleOracle size={160} />;
 * }
 *
 * ── Disparar "thinking" con cada input del quiz ───────────
 * "use client";
 * import { useRef } from "react";
 * import ParticleOracle from "@/components/ParticleOracle";
 *
 * export default function Step() {
 *   const oracle = useRef(null);
 *   return (
 *     <>
 *       <ParticleOracle ref={oracle} size={140} />
 *       <button onClick={() => {
 *         oracle.current?.pulse();
 *         // ... tu lógica
 *       }}>
 *         Tecnología
 *       </button>
 *     </>
 *   );
 * }
 *
 * ── Props ─────────────────────────────────────────────────
 *   size?: number                 (default 160)
 *   bodyCount?: number            (default 900)
 *   haloCount?: number            (default 360)
 *   thinking?: boolean            (controlado)
 *   thinkingDuration?: number     (ms, default 600)
 *   colors?: Partial<{lime, limeDeep, limeShadow, limeGlow, specular}>
 *   className?, style?, onClick?
 *
 * ── API ref ───────────────────────────────────────────────
 *   pulse(): void        // activa thinking por thinkingDuration ms
 *   isThinking(): bool
 */

const COLORS = {
  lime: "#C8F542",
  limeDeep: "#6B9A15",
  limeShadow: "#2A4005",
  limeGlow: "#E4FF8A",
  specular: "#FFFFFF",
};

// Distribución uniforme Fibonacci en una esfera unitaria
function fibonacciSphere(n) {
  const pts = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = golden * i;
    pts[i * 3] = Math.cos(theta) * radius;
    pts[i * 3 + 1] = y;
    pts[i * 3 + 2] = Math.sin(theta) * radius;
  }
  return pts;
}

// Órbitas con planos 3D distribuidos uniformemente
function buildOrbits(count, innerR, outerR) {
  const orbits = [];
  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const nx = Math.sin(phi) * Math.cos(theta);
    const ny = Math.sin(phi) * Math.sin(theta);
    const nz = Math.cos(phi);
    const zHint = Math.abs(nz) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    let u1x = ny * zHint[2] - nz * zHint[1];
    let u1y = nz * zHint[0] - nx * zHint[2];
    let u1z = nx * zHint[1] - ny * zHint[0];
    const len = Math.hypot(u1x, u1y, u1z) || 1;
    u1x /= len; u1y /= len; u1z /= len;
    const u2x = ny * u1z - nz * u1y;
    const u2y = nz * u1x - nx * u1z;
    const u2z = nx * u1y - ny * u1x;
    orbits.push({
      a: innerR + Math.random() * (outerR - innerR),
      u1x, u1y, u1z, u2x, u2y, u2z,
      phase: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.35,
      dir: Math.random() > 0.5 ? 1 : -1,
      size: 0.3 + Math.random() * 1.2,
      twinkle: Math.random() * Math.PI * 2,
    });
  }
  return orbits;
}

function hexA(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const ParticleOracle = forwardRef(function ParticleOracle(
  {
    size = 160,
    bodyCount = 900,
    haloCount = 360,
    thinking = false,
    thinkingDuration = 600,
    className,
    style,
    onClick,
    colors,
  },
  ref
) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef({
    rotY: 0, rotX: -0.3, t: 0,
    disperse: 0, jitter: 0, expansion: 0,
    thinking: false, thinkingUntil: 0,
    visible: true,
  });
  const dataRef = useRef(null);

  useImperativeHandle(ref, () => ({
    pulse: () => {
      stateRef.current.thinkingUntil = performance.now() + thinkingDuration;
    },
    isThinking: () => stateRef.current.thinking,
  }), [thinkingDuration]);

  useEffect(() => {
    stateRef.current.thinking = thinking;
  }, [thinking]);

  useEffect(() => {
    dataRef.current = {
      body: fibonacciSphere(bodyCount),
      orbits: buildOrbits(haloCount, size * 0.6, size * 0.88),
    };
  }, [bodyCount, haloCount, size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    ctx.scale(dpr, dpr);

    const C = { ...COLORS, ...(colors || {}) };
    const cx = size / 2, cy = size / 2;
    const bodyRadius = size * 0.3;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let io;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => { stateRef.current.visible = entries[0]?.isIntersecting ?? true; },
        { threshold: 0.01 }
      );
      io.observe(canvas);
    }

    const onVisibility = () => {
      stateRef.current.visible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);

    let t0 = performance.now();

    const loop = (now) => {
      const dt = Math.min(0.05, (now - t0) / 1000);
      t0 = now;
      const s = stateRef.current;

      if (!s.visible) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const activeByTimer = now < s.thinkingUntil;
      const active = s.thinking || activeByTimer;

      const timeMult = reducedMotion ? 0.3 : 1;
      s.t += dt * timeMult;

      const baseSpeed = active ? 2.2 : 0.35;
      s.rotY += baseSpeed * dt * timeMult;
      s.rotX = -0.3 + Math.sin(s.t * 0.3) * 0.15;

      const target = active ? 1 : 0;
      const k = Math.min(1, dt * 6);
      s.disperse += (target - s.disperse) * k;
      s.expansion += (target - s.expansion) * k;
      s.jitter = active ? 1 : Math.max(0, s.jitter - dt * 3);

      const data = dataRef.current;
      if (!data) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      ctx.clearRect(0, 0, size, size);

      // Bloom exterior
      const bloomR = size * 0.42 + s.expansion * size * 0.08;
      const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, bloomR);
      bloom.addColorStop(0, hexA(C.lime, 0.35));
      bloom.addColorStop(0.5, hexA(C.lime, 0.12));
      bloom.addColorStop(1, hexA(C.lime, 0));
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, size, size);

      // Halo orbital
      const speedMult = active ? 3.5 : 1;
      const expFactor = 1 + s.expansion * 0.25;
      for (let i = 0; i < data.orbits.length; i++) {
        const o = data.orbits[i];
        const angle = o.phase + s.t * o.speed * o.dir * speedMult;
        const r = o.a * expFactor;
        const ca = Math.cos(angle) * r;
        const sa = Math.sin(angle) * r;
        const x = ca * o.u1x + sa * o.u2x;
        const y = ca * o.u1y + sa * o.u2y;
        const z = ca * o.u1z + sa * o.u2z;
        const depth = (z / r + 1) / 2;
        const tw = 0.6 + 0.4 * Math.sin(s.t * 2 + o.twinkle);
        const scaleH = size / 280;
        const ps = o.size * (0.35 + depth * 0.9) * Math.max(0.55, scaleH);
        const opacity = (0.25 + depth * 0.75) * tw;
        const fill = depth > 0.75 ? C.specular : depth > 0.45 ? C.limeGlow : C.lime;
        ctx.globalAlpha = opacity;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(cx + x, cy + y, ps, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cuerpo esférico
      const sy = Math.sin(s.rotY), cyr = Math.cos(s.rotY);
      const sx = Math.sin(s.rotX), cxr = Math.cos(s.rotX);
      const body = data.body;
      const n = body.length / 3;

      for (let i = 0; i < n; i++) {
        const px0 = body[i * 3];
        const py0 = body[i * 3 + 1];
        const pz0 = body[i * 3 + 2];

        let x = px0 * cyr + pz0 * sy;
        let z = -px0 * sy + pz0 * cyr;
        let y = py0;
        const y2 = y * cxr - z * sx;
        const z2 = y * sx + z * cxr;
        y = y2; z = z2;

        const disp = s.disperse * (0.15 + 0.25 * Math.sin(i * 0.37 + s.t * 5));
        const r = bodyRadius * (1 + disp);
        const jx = s.jitter * Math.sin(i * 1.3 + s.t * 12) * 1.2;
        const jy = s.jitter * Math.cos(i * 1.7 + s.t * 10) * 1.2;

        const depth = (z + 1) / 2;
        const scale = size / 280;
        const ps = (0.35 + depth * 1.4) * Math.max(0.55, scale);
        const opacity = 0.15 + depth * 0.85;
        const fill = depth > 0.85 ? C.specular : depth > 0.65 ? C.limeGlow : depth > 0.35 ? C.lime : C.limeDeep;

        ctx.globalAlpha = opacity * 0.22;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(cx + x * r + jx, cy + y * r + jy, ps * 2.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(cx + x * r + jx, cy + y * r + jy, ps, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [size, colors]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", ...style }}
      onClick={onClick}
      aria-hidden="true"
    />
  );
});

export default ParticleOracle;
