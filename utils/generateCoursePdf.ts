import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { ExpandedCourseContent } from '@/services/openaiEbookService';

const W = 595;
const H = 842;
const M = 56;
const BW = W - 2 * M;

const COL_PRIMARY = rgb(0.12, 0.13, 0.32);
const COL_ACCENT = rgb(0.24, 0.30, 0.62);
const COL_BODY = rgb(0.18, 0.18, 0.22);
const COL_MUTED = rgb(0.45, 0.45, 0.50);
const COL_RULE = rgb(0.80, 0.80, 0.84);
const COL_BG = rgb(0.95, 0.95, 0.97);
const COL_TOPIC_BG = rgb(0.90, 0.91, 0.96);

function safe(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[^\x00-\x7F\xA0-\xFF\n]/g, '').trim();
}

function wrap(
  text: string,
  maxW: number,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  size: number
): string[] {
  const out: string[] = [];
  for (const word of text.split(/\s+/)) {
    const cur = out[out.length - 1];
    const next = cur ? `${cur} ${word}` : word;
    if (!cur || font.widthOfTextAtSize(next, size) <= maxW) {
      out[out.length > 0 ? out.length - 1 : 0] = next;
    } else {
      out.push(word);
    }
  }
  return out;
}

interface TocItem { type: 'topic' | 'lesson'; title: string; pg: number }

export interface PdfLogos {
  recursalia?: Uint8Array;
  hotmart?: Uint8Array;
}

async function embedLogo(doc: PDFDocument, bytes: Uint8Array, maxW: number, maxH: number) {
  const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8;
  const img = isJpeg ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
  const s = Math.min(maxW / img.width, maxH / img.height, 1);
  return { img, w: img.width * s, h: img.height * s };
}

export async function generateCoursePdf(
  content: ExpandedCourseContent,
  logos?: PdfLogos
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fReg = await doc.embedFont(StandardFonts.Helvetica);
  const fBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fIt = await doc.embedFont(StandardFonts.HelveticaOblique);

  const recLogo = logos?.recursalia?.length ? await embedLogo(doc, logos.recursalia, 180, 50) : null;
  const hotLogo = logos?.hotmart?.length ? await embedLogo(doc, logos.hotmart, 140, 40) : null;

  const toc: TocItem[] = [];
  const title = safe(content.title);
  const shortDesc = safe(content.short_description ?? '');
  const year = new Date().getFullYear();

  // ─── helpers ───
  let pg = doc.addPage([W, H]);
  let y = H - M;

  function newPg() { pg = doc.addPage([W, H]); y = H - M; }
  function need(n: number) { if (y - n < M + 30) newPg(); }

  function drawWrapped(text: string, font: typeof fReg, size: number, color: typeof COL_BODY, indent = 0, lh?: number) {
    const lineH = lh ?? size + 3;
    const lines = wrap(safe(text), BW - indent, font, size);
    need(lines.length * lineH);
    for (const ln of lines) {
      pg.drawText(ln, { x: M + indent, y, size, font, color });
      y -= lineH;
    }
  }

  function drawParagraphs(text: string) {
    const paras = safe(text).split(/\n\n+/);
    for (const p of paras) {
      if (!p.trim()) continue;
      drawWrapped(p.trim(), fReg, 10, COL_BODY, 0, 14);
      y -= 6;
    }
  }

  function pageFooter(pageNum?: number) {
    const num = pageNum ?? doc.getPageCount();
    pg.drawLine({ start: { x: M, y: M - 14 }, end: { x: W - M, y: M - 14 }, thickness: 0.5, color: COL_RULE });
    pg.drawText(String(num), { x: W / 2 - 4, y: M - 26, size: 8, font: fReg, color: COL_MUTED });
  }

  // ━━━━━━━━━━━━━━ PORTADA ━━━━━━━━━━━━━━
  pg.drawRectangle({ x: 0, y: 0, width: W, height: H, color: COL_BG });
  pg.drawRectangle({ x: 0, y: H - 8, width: W, height: 8, color: COL_ACCENT });
  pg.drawRectangle({ x: 0, y: 0, width: W, height: 6, color: COL_ACCENT });

  if (recLogo) {
    pg.drawImage(recLogo.img, { x: M, y: H - 60 - recLogo.h, width: recLogo.w, height: recLogo.h });
  }

  y = H - 200;
  const titleLines = wrap(title, W - 2 * M, fBold, 28);
  for (const ln of titleLines) {
    pg.drawText(ln, { x: M, y, size: 28, font: fBold, color: COL_PRIMARY });
    y -= 34;
  }
  y -= 4;
  pg.drawLine({ start: { x: M, y }, end: { x: M + 120, y }, thickness: 3, color: COL_ACCENT });
  y -= 28;

  if (shortDesc) {
    const subLines = wrap(shortDesc, W - 2 * M, fReg, 13);
    for (const ln of subLines.slice(0, 3)) {
      pg.drawText(ln, { x: M, y, size: 13, font: fReg, color: COL_MUTED });
      y -= 18;
    }
  }

  if (content.author_name) {
    y -= 30;
    pg.drawText(safe(content.author_name), { x: M, y, size: 12, font: fIt, color: COL_ACCENT });
  }

  if (hotLogo) {
    pg.drawImage(hotLogo.img, { x: W - M - hotLogo.w, y: 30, width: hotLogo.w, height: hotLogo.h });
  }
  pg.drawText(`${year} Recursalia. Todos los derechos reservados.`, {
    x: M,
    y: 32,
    size: 7,
    font: fReg,
    color: COL_MUTED,
  });

  // ━━━━━━━━━━━━━━ PÁGINA LEGAL / COPYRIGHT ━━━━━━━━━━━━━━
  newPg();
  pg.drawRectangle({ x: 0, y: 0, width: W, height: H, color: COL_BG });
  y = H - 120;
  pg.drawText(title, { x: M, y, size: 14, font: fBold, color: COL_PRIMARY });
  y -= 30;
  const legalLines = [
    `${year} Recursalia. Todos los derechos reservados.`,
    '',
    'Queda prohibida la reproduccion total o parcial de este libro,',
    'su incorporacion a un sistema informatico, su transmision en',
    'cualquier forma o por cualquier medio, sea este electronico,',
    'mecanico, por fotocopia, por grabacion u otros metodos, sin',
    'el permiso previo y por escrito del editor.',
    '',
    'Publicado y distribuido a traves de Hotmart.',
    '',
    'Creado con la plataforma Recursalia.',
    'recursalia.com',
  ];
  for (const ln of legalLines) {
    pg.drawText(ln, { x: M, y, size: 9, font: fReg, color: COL_MUTED });
    y -= 14;
  }

  // ━━━━━━━━━━━━━━ CONTENIDO (recoger TOC) ━━━━━━━━━━━━━━

  // Introducción
  newPg();
  pg.drawText('Introduccion', { x: M, y, size: 20, font: fBold, color: COL_PRIMARY });
  y -= 30;
  pg.drawLine({ start: { x: M, y: y + 6 }, end: { x: W - M, y: y + 6 }, thickness: 0.5, color: COL_RULE });
  y -= 16;
  if (content.description) drawParagraphs(content.description);
  pageFooter();

  // Módulos y lecciones
  for (const topic of content.topics ?? []) {
    newPg();
    const safeTopic = safe(topic.title);
    toc.push({ type: 'topic', title: safeTopic, pg: doc.getPageCount() - 1 });

    pg.drawRectangle({ x: 0, y: H - 130, width: W, height: 130, color: COL_TOPIC_BG });
    pg.drawRectangle({ x: 0, y: H - 134, width: W, height: 4, color: COL_ACCENT });
    y = H - 80;
    const topicLines = wrap(safeTopic, W - 2 * M, fBold, 20);
    for (const ln of topicLines) {
      pg.drawText(ln, { x: M, y, size: 20, font: fBold, color: COL_PRIMARY });
      y -= 26;
    }
    y = H - 160;

    for (const lesson of topic.lessons) {
      const safeLesson = safe(lesson.title);
      toc.push({ type: 'lesson', title: safeLesson, pg: doc.getPageCount() - 1 });

      need(60);
      y -= 12;
      pg.drawLine({ start: { x: M, y: y + 20 }, end: { x: W - M, y: y + 20 }, thickness: 0.5, color: COL_RULE });
      y -= 4;
      drawWrapped(safeLesson, fBold, 13, COL_ACCENT);
      y -= 8;

      if (lesson.content) {
        drawParagraphs(lesson.content);
      }
      y -= 14;
    }
    pageFooter();
  }

  // ━━━━━━━━━━━━━━ ÍNDICE (se inserta tras la página legal) ━━━━━━━━━━━━━━
  const tocPg = doc.insertPage(2, [W, H]);
  let ty = H - 80;
  tocPg.drawText('Indice', { x: M, y: ty, size: 22, font: fBold, color: COL_PRIMARY });
  ty -= 12;
  tocPg.drawLine({ start: { x: M, y: ty }, end: { x: W - M, y: ty }, thickness: 1, color: COL_RULE });
  ty -= 24;

  for (const item of toc) {
    if (ty < M + 20) break;
    const isTopic = item.type === 'topic';
    const label = item.title.length > 60 ? item.title.slice(0, 57) + '...' : item.title;
    tocPg.drawText(label, {
      x: M + (isTopic ? 0 : 18),
      y: ty,
      size: isTopic ? 11 : 9.5,
      font: isTopic ? fBold : fReg,
      color: isTopic ? COL_PRIMARY : COL_BODY,
    });
    const humanPg = item.pg + 2;
    tocPg.drawText(String(humanPg), {
      x: W - M - 20,
      y: ty,
      size: 9,
      font: fReg,
      color: COL_MUTED,
    });
    if (!isTopic) {
      const dotY = ty + 3;
      tocPg.drawLine({
        start: { x: M + 18 + fReg.widthOfTextAtSize(label, 9.5) + 6, y: dotY },
        end: { x: W - M - 28, y: dotY },
        thickness: 0.3,
        color: COL_RULE,
      });
    }
    ty -= isTopic ? 22 : 15;
  }
  tocPg.drawLine({ start: { x: M, y: M - 14 }, end: { x: W - M, y: M - 14 }, thickness: 0.5, color: COL_RULE });

  // ━━━━━━━━━━━━━━ CONTRAPORTADA ━━━━━━━━━━━━━━
  const back = doc.addPage([W, H]);
  back.drawRectangle({ x: 0, y: 0, width: W, height: H, color: COL_BG });
  back.drawRectangle({ x: 0, y: H - 8, width: W, height: 8, color: COL_ACCENT });
  back.drawRectangle({ x: 0, y: 0, width: W, height: 6, color: COL_ACCENT });

  let bY = H / 2 + 50;
  if (recLogo) {
    const bw = Math.min(recLogo.w * 2.2, 240);
    const bh = (recLogo.h / recLogo.w) * bw;
    back.drawImage(recLogo.img, { x: W / 2 - bw / 2, y: bY - bh, width: bw, height: bh });
    bY -= bh + 30;
  }
  if (hotLogo) {
    const bw = Math.min(hotLogo.w * 1.8, 180);
    const bh = (hotLogo.h / hotLogo.w) * bw;
    back.drawImage(hotLogo.img, { x: W / 2 - bw / 2, y: bY - bh, width: bw, height: bh });
    bY -= bh + 30;
  }

  const cr = `${year} Recursalia. Todos los derechos reservados.`;
  back.drawText(cr, {
    x: W / 2 - fReg.widthOfTextAtSize(cr, 8) / 2,
    y: 40,
    size: 8,
    font: fReg,
    color: COL_MUTED,
  });

  return doc.save();
}
