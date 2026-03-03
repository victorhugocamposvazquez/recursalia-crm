/**
 * Genera un PDF con portada, índice, contenido completo y contraportada.
 * Incluye marcas Recursalia y Hotmart. Pensado para ebook en Hotmart.
 */

import { PDFDocument, StandardFonts, rgb, RGB } from 'pdf-lib';
import type { GeneratedCourseStructure } from '@/types';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 50;
const BODY_WIDTH = PAGE_WIDTH - 2 * MARGIN;

// Colores
const PRIMARY: RGB = rgb(0.2, 0.2, 0.45);
const ACCENT: RGB = rgb(0.35, 0.35, 0.7);
const TEXT: RGB = rgb(0.15, 0.15, 0.2);
const TEXT_LIGHT: RGB = rgb(0.4, 0.4, 0.45);

function stripHtml(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function wrapLines(
  text: string,
  maxWidth: number,
  font: { widthOfTextAtSize: (t: string, size: number) => number },
  fontSize: number
): string[] {
  const lines: string[] = [];
  const words = text.split(/\s+/);
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface TocEntry {
  type: 'topic' | 'lesson';
  title: string;
  page: number; // 0-based index antes de insertar TOC
}

export interface CoursePdfLogos {
  recursalia?: Uint8Array; // PNG o JPG
  hotmart?: Uint8Array;
  recursaliaIsPng?: boolean;
  hotmartIsPng?: boolean;
}

const LOGO_MAX_HEIGHT = 36;
const LOGO_MAX_WIDTH = 140;

export async function generateCoursePdf(
  content: GeneratedCourseStructure,
  logos?: CoursePdfLogos
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  let embedRecursalia: { width: number; height: number; embed: Awaited<ReturnType<PDFDocument['embedPng']>> } | null = null;
  let embedHotmart: { width: number; height: number; embed: Awaited<ReturnType<PDFDocument['embedPng']>> } | null = null;
  if (logos?.recursalia?.length) {
    try {
      const embed = logos.recursaliaIsPng !== false
        ? await doc.embedPng(logos.recursalia)
        : await doc.embedJpg(logos.recursalia);
      const scale = Math.min(LOGO_MAX_WIDTH / embed.width, LOGO_MAX_HEIGHT / embed.height, 1);
      embedRecursalia = { width: embed.width * scale, height: embed.height * scale, embed };
    } catch {
      // Si falla (formato no válido), se usa solo texto
    }
  }
  if (logos?.hotmart?.length) {
    try {
      const embed = logos.hotmartIsPng !== false
        ? await doc.embedPng(logos.hotmart)
        : await doc.embedJpg(logos.hotmart);
      const scale = Math.min(LOGO_MAX_WIDTH / embed.width, LOGO_MAX_HEIGHT / embed.height, 1);
      embedHotmart = { width: embed.width * scale, height: embed.height * scale, embed };
    } catch {
      // Si falla, se usa solo texto
    }
  }

  const tocEntries: TocEntry[] = [];

  // —— PORTADA ——
  const coverPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const coverY = PAGE_HEIGHT - 100;
  coverPage.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: rgb(0.96, 0.96, 0.98),
  });
  const coverTitleLines = wrapLines(content.title, PAGE_WIDTH - 80, fontBold, 26);
  let cy = coverY;
  for (const line of coverTitleLines) {
    coverPage.drawText(line, {
      x: MARGIN + 20,
      y: cy,
      size: 26,
      font: fontBold,
      color: PRIMARY,
    });
    cy -= 32;
  }
  cy -= 8;
  coverPage.drawLine({
    start: { x: MARGIN + 20, y: cy },
    end: { x: MARGIN + 180, y: cy },
    thickness: 2,
    color: ACCENT,
  });
  cy -= 24;
  if (content.short_description) {
    const subLines = wrapLines(content.short_description, PAGE_WIDTH - 80, font, 12);
    for (const line of subLines.slice(0, 4)) {
      coverPage.drawText(line, { x: MARGIN + 20, y: cy, size: 12, font, color: TEXT_LIGHT });
      cy -= 16;
    }
  }
  cy -= 50;
  if (embedRecursalia) {
    coverPage.drawImage(embedRecursalia.embed, {
      x: MARGIN + 20,
      y: cy - embedRecursalia.height,
      width: embedRecursalia.width,
      height: embedRecursalia.height,
    });
    cy -= embedRecursalia.height + 12;
  } else {
    coverPage.drawText('Recursalia', {
      x: MARGIN + 20,
      y: cy,
      size: 14,
      font: fontBold,
      color: ACCENT,
    });
    cy -= 22;
  }
  if (embedHotmart) {
    coverPage.drawImage(embedHotmart.embed, {
      x: MARGIN + 20,
      y: cy - embedHotmart.height,
      width: embedHotmart.width,
      height: embedHotmart.height,
    });
    cy -= embedHotmart.height + 8;
  } else {
    coverPage.drawText('Hotmart', {
      x: MARGIN + 20,
      y: cy,
      size: 12,
      font: fontOblique,
      color: TEXT_LIGHT,
    });
    cy -= 20;
  }

  // —— CONTENIDO (y recoger TOC) ——
  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;
  const LINE_HEIGHT = 14;
  const BODY_SIZE = 10;
  const TOPIC_SIZE = 16;
  const LESSON_SIZE = 12;

  function newPage(): void {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  }

  function ensureSpace(needed: number): void {
    if (y - needed < MARGIN + 40) {
      newPage();
    }
  }

  function drawParagraph(text: string): void {
    const plain = stripHtml(text);
    if (!plain) return;
    const paragraphs = plain.split(/\n\n+/);
    for (const para of paragraphs) {
      const lines = wrapLines(para.trim(), BODY_WIDTH, font, BODY_SIZE);
      ensureSpace(lines.length * LINE_HEIGHT);
      for (const line of lines) {
        page.drawText(line, { x: MARGIN, y, size: BODY_SIZE, font, color: TEXT });
        y -= LINE_HEIGHT;
      }
      y -= 8;
    }
    y -= 8;
  }

  // Introducción: descripción completa del curso (todo el contenido generado)
  ensureSpace(80);
  page.drawText(content.title, {
    x: MARGIN,
    y,
    size: TOPIC_SIZE,
    font: fontBold,
    color: PRIMARY,
  });
  y -= TOPIC_SIZE + 12;
  if (content.short_description) {
    drawParagraph(content.short_description);
  }
  if (content.description) {
    drawParagraph(content.description);
  }
  y -= 24;

  for (const topic of content.topics ?? []) {
    ensureSpace(TOPIC_SIZE + 30);
    const pageIndex = doc.getPageCount() - 1;
    tocEntries.push({ type: 'topic', title: topic.title, page: pageIndex });

    page.drawRectangle({
      x: MARGIN,
      y: y - 4,
      width: BODY_WIDTH,
      height: TOPIC_SIZE + 14,
      color: rgb(0.92, 0.92, 0.96),
    });
    page.drawText(topic.title, {
      x: MARGIN + 8,
      y: y + 2,
      size: TOPIC_SIZE,
      font: fontBold,
      color: PRIMARY,
    });
    y -= TOPIC_SIZE + 24;

    for (const lesson of topic.lessons) {
      ensureSpace(LESSON_SIZE + 25);
      const lessonPageIndex = doc.getPageCount() - 1;
      tocEntries.push({ type: 'lesson', title: lesson.title, page: lessonPageIndex });

      page.drawText(lesson.title, {
        x: MARGIN,
        y,
        size: LESSON_SIZE,
        font: fontBold,
        color: ACCENT,
      });
      y -= LESSON_SIZE + 8;
      if (lesson.content) {
        drawParagraph(lesson.content);
      }
      y -= 8;
    }
    y -= 20;
  }

  // —— INSERTAR PÁGINA DE ÍNDICE tras la portada ——
  const tocPage = doc.insertPage(1, [PAGE_WIDTH, PAGE_HEIGHT]);
  let tocY = PAGE_HEIGHT - 70;
  tocPage.drawText('Índice', {
    x: MARGIN,
    y: tocY,
    size: 22,
    font: fontBold,
    color: PRIMARY,
  });
  tocY -= 36;
  tocPage.drawLine({
    start: { x: MARGIN, y: tocY },
    end: { x: PAGE_WIDTH - MARGIN, y: tocY },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.9),
  });
  tocY -= 24;

  for (const entry of tocEntries) {
    if (tocY < MARGIN + 30) break;
    const humanPage = entry.page + 2;
    const isTopic = entry.type === 'topic';
    tocPage.drawText(entry.title, {
      x: MARGIN + (isTopic ? 0 : 16),
      y: tocY,
      size: isTopic ? 12 : 10,
      font: isTopic ? fontBold : font,
      color: isTopic ? PRIMARY : TEXT,
    });
    tocPage.drawText(String(humanPage), {
      x: PAGE_WIDTH - MARGIN - 24,
      y: tocY,
      size: 10,
      font,
      color: TEXT_LIGHT,
    });
    tocY -= isTopic ? 18 : 14;
  }

  // —— CONTRAPORTADA (última página) ——
  const backPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  backPage.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: rgb(0.96, 0.96, 0.98),
  });
  let by = PAGE_HEIGHT / 2 + 50;
  if (embedRecursalia) {
    const bw = Math.min(embedRecursalia.width * 1.2, 160);
    const bh = (embedRecursalia.height / embedRecursalia.width) * bw;
    backPage.drawImage(embedRecursalia.embed, {
      x: PAGE_WIDTH / 2 - bw / 2,
      y: by - bh,
      width: bw,
      height: bh,
    });
    by -= bh + 24;
  } else {
    backPage.drawText('Recursalia', {
      x: PAGE_WIDTH / 2 - 80,
      y: by,
      size: 18,
      font: fontBold,
      color: ACCENT,
    });
    by -= 28;
  }
  if (embedHotmart) {
    const bw = Math.min(embedHotmart.width * 1.2, 120);
    const bh = (embedHotmart.height / embedHotmart.width) * bw;
    backPage.drawImage(embedHotmart.embed, {
      x: PAGE_WIDTH / 2 - bw / 2,
      y: by - bh,
      width: bw,
      height: bh,
    });
    by -= bh + 20;
  } else {
    backPage.drawText('Hotmart', {
      x: PAGE_WIDTH / 2 - 45,
      y: by,
      size: 14,
      font: fontOblique,
      color: TEXT_LIGHT,
    });
  }

  return doc.save();
}
