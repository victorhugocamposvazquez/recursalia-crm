// @ts-nocheck
// components/learn/diploma-pdf.ts
// Genera el diploma como PDF vectorial usando jsPDF.
//   import { generateDiplomaPDF } from '@/components/learn/diploma-pdf';
//   await generateDiplomaPDF({ name, course, ... });
//
// Requiere instalar:  pnpm add jspdf
// (o npm i jspdf / yarn add jspdf)

import { jsPDF } from 'jspdf';

export interface DiplomaPDFOptions {
  name?: string;
  course?: string;
  instructor?: string;
  ceo?: string;
  date?: string;
  certNumber?: string;
  score?: string;
  lessons?: string;
  verifyUrl?: string;
  accentHex?: string;
  accentInk?: string;
}

// hex → [r, g, b] 0–255
  function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)] as [number, number, number];
  }

  export async function generateDiplomaPDF(opts: DiplomaPDFOptions = {}): Promise<string> {
    const {
      name        = 'Hugo Marín Sastre',
      course      = 'Captura el mundo a través de tu lente',
      instructor  = 'Lucía Vega',
      ceo         = 'Eric Roldán',
      date        = '22 may 2026',
      certNumber  = 'RX-2026-0428',
      score       = '90%',
      lessons     = '14 lecciones · 4 h 38 min',
      verifyUrl   = 'recursalia.app/verify/rx-2026-0428',
      accentHex   = '#C8F542',
      accentInk   = '#0A0A14',
    } = opts;

    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });

    // A4 landscape = 297 × 210 mm
    const W = 297, H = 210;

    // Fondo blanco
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, 'F');

    const ink = [10, 10, 20];
    const muted = [107, 107, 122];
    const line = [220, 220, 220];

    // ── Marco interior con marcas en las esquinas ─────────────────────────────
    doc.setDrawColor(...ink);
    doc.setLineWidth(0.2);
    const m = 14, mark = 5;
    // TL
    doc.line(m, m, m + mark, m); doc.line(m, m, m, m + mark);
    // TR
    doc.line(W - m - mark, m, W - m, m); doc.line(W - m, m, W - m, m + mark);
    // BL
    doc.line(m, H - m, m + mark, H - m); doc.line(m, H - m - mark, m, H - m);
    // BR
    doc.line(W - m - mark, H - m, W - m, H - m); doc.line(W - m, H - m - mark, W - m, H - m);

    // ── Header: Logo + Nº ────────────────────────────────────────────────────
    // Hex outline + chevron logo (vector)
    drawHexLogo(doc, 22, 20, 8, ink);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...ink);
    doc.text('Recursalia', 33, 22.5);

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    const brandRgb = [27, 56, 196];
    doc.setTextColor(...brandRgb);
    doc.text(`DIPLOMA · NUM. ${certNumber}`.toUpperCase(), W - m - 5, 22, { align: 'right' });

    // Pequeño punto azul de marca junto al wordmark
    doc.setFillColor(...brandRgb);
    doc.circle(60, 21.5, 1, 'F');

    // ── Body principal ──────────────────────────────────────────────────────
    // Etiqueta "Certifica que"
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    const accentRgb = hexToRgb(accentHex);
    // Si el acento es muy claro (como la lima), usamos una versión más oscura para texto
    const accentForText = accentHex === '#C8F542' ? [90, 123, 14] : accentRgb;
    doc.setTextColor(...accentForText);
    doc.text('CERTIFICA QUE', 24, 56);

    // Nombre — serif grande
    doc.setFont('times', 'normal');
    doc.setFontSize(44);
    doc.setTextColor(...ink);
    doc.text(name, 24, 78);

    // Descripción
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...muted);
    doc.text('Ha completado satisfactoriamente el programa formativo', 24, 90);

    // Curso — serif itálica
    doc.setFont('times', 'italic');
    doc.setFontSize(24);
    doc.setTextColor(...ink);
    const courseTitle = course.endsWith('.') ? course : course + '.';
    // Wrap si excede ancho disponible
    const courseWrapped = doc.splitTextToSize(courseTitle, W - 90);
    doc.text(courseWrapped, 24, 102);

    // Sub-info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...muted);
    doc.text(`${lessons} · Examen final superado con un ${score}`, 24, 116 + (courseWrapped.length - 1) * 9);

    // ── Sello de acento ─────────────────────────────────────────────────────
    const sealCx = W - 50, sealCy = H / 2 + 10, sealR = 18;
    doc.setFillColor(...accentRgb);
    doc.circle(sealCx, sealCy, sealR, 'F');
    // anillo punteado interior
    doc.setDrawColor(...hexToRgb(accentInk));
    doc.setLineWidth(0.15);
    doc.setLineDashPattern([0.6, 0.8], 0);
    doc.circle(sealCx, sealCy, sealR - 2, 'S');
    doc.setLineDashPattern([], 0);

    // texto sello
    const sealInkRgb = hexToRgb(accentInk);
    doc.setTextColor(...sealInkRgb);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.text('VERIFICADO', sealCx, sealCy - 6, { align: 'center' });
    doc.setFont('times', 'italic');
    doc.setFontSize(22);
    doc.text('★', sealCx, sealCy + 2, { align: 'center' });
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.text('RECURSALIA', sealCx, sealCy + 9, { align: 'center' });

    // ── Firmas ──────────────────────────────────────────────────────────────
    // Izquierda — instructor
    drawSignatureCurve(doc, 24, H - 42, 60, ink, 1);
    doc.setDrawColor(...ink);
    doc.setLineWidth(0.25);
    doc.line(24, H - 38, 80, H - 38);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...ink);
    doc.text(instructor, 24, H - 33);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text('Fotógrafa · Instructora', 24, H - 28);

    // Derecha — CEO
    drawSignatureCurve(doc, W - 84, H - 42, 60, ink, 2);
    doc.line(W - 84, H - 38, W - 28, H - 38);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...ink);
    doc.text(ceo, W - 28, H - 33, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text('CEO · Recursalia', W - 28, H - 28, { align: 'right' });

    // ── Footer verification ─────────────────────────────────────────────────
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...muted);
    doc.text(`EMITIDO · ${date.toUpperCase()}`, 24, H - 18);
    doc.setTextColor(...brandRgb);
    doc.text(verifyUrl, W - 24, H - 18, { align: 'right' });

    // Mini puntos decorativos (textura sutil del papel)
    doc.setFillColor(230, 230, 232);
    for (let y = 30; y < H - 30; y += 8) {
      for (let x = 90; x < W - 80; x += 8) {
        if ((x + y) % 16 === 0) doc.circle(x, y, 0.15, 'F');
      }
    }

    // Guardar
    const filename = `recursalia-diploma-${certNumber.toLowerCase()}.pdf`;
    doc.save(filename);
    return filename;
  };

  // Dibuja el hex logo de Recursalia (outline + chevron + curva)
  function drawHexLogo(doc: jsPDF, cx: number, cy: number, r: number, color: [number, number, number]) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI/2 + i * Math.PI/3;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    doc.setDrawColor(...color);
    doc.setLineWidth(0.6);
    doc.setLineJoin('round');
    // hex
    for (let i = 0; i < 6; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % 6];
      doc.line(x1, y1, x2, y2);
    }
    // Curva (Q): aproximamos con dos líneas
    const curveYTop = cy - 0.5;
    doc.setLineWidth(0.55);
    doc.line(cx - 3.5, cy + 0.3, cx, curveYTop);
    doc.line(cx, curveYTop, cx + 3.5, cy + 0.3);
    // Chevron
    doc.line(cx - 3.5, cy + 1.5, cx, cy + 3.5);
    doc.line(cx, cy + 3.5, cx + 3.5, cy + 1.5);
  }

  // Curva tipo firma a mano
  function drawSignatureCurve(doc: jsPDF, x: number, y: number, w: number, color: [number, number, number], variant: number = 1) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.35);
    const segs = 30;
    const phase = variant === 1 ? 0 : 0.8;
    const prev = { x, y };
    for (let i = 1; i <= segs; i++) {
      const tt = i / segs;
      const px = x + tt * w;
      const py = y + Math.sin(tt * Math.PI * (variant === 1 ? 2.5 : 3) + phase) * 2.4
                  + Math.cos(tt * Math.PI * 4 + phase) * 1.0;
      doc.line(prev.x, prev.y, px, py);
      prev.x = px; prev.y = py;
    }
  }
