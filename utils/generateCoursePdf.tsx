import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
  renderToBuffer,
} from '@react-pdf/renderer';
import type { ExpandedCourseContent } from '@/services/openaiEbookService';
import type { ModulePlan } from '@/services/openaiEditorialPlan';
import { resolveCourseAuthorDisplay } from '@/lib/courseAuthorDefaults';
import {
  BRAND_BLUE,
  BRAND_INK,
  RecursaliaLockup,
  RecursaliaMark,
} from '@/components/pdf/RecursaliaLogo';
import { registerPdfFonts, FONT_BODY, FONT_DISPLAY } from '@/lib/pdfFonts';

// Efecto colateral: registra Inter + Source Serif 4 y desactiva hifenación.
registerPdfFonts();

/**
 * Compat: el route handler antiguo pasaba aquí los bytes del PNG de Recursalia.
 * Con el logo ahora reconstruido en SVG nativo, esta opción se ignora pero el
 * tipo se mantiene para no romper llamadas existentes.
 */
export interface PdfLogos {
  recursalia?: Uint8Array;
}

/**
 * Limpieza ligera: quita caracteres de control y normaliza espacios. A
 * diferencia de versiones previas, conservamos comillas tipográficas, em-dashes
 * y demás caracteres Unicode porque Inter y Source Serif 4 los soportan.
 */
function safe(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n?/g, '\n')
    // Caracteres de control (excepto \n y \t)
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B-\x1F\x7F]/g, '')
    .trim();
}

/** Quita tags HTML, decodifica entidades comunes y normaliza saltos. */
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>(?=[\s\S])/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|ul|ol|blockquote)>/gi, '\n\n')
    .replace(/<(p|div|h[1-6]|ul|ol|blockquote)[^>]*>/gi, '')
    .replace(/<li[^>]*>/gi, '· ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ────────────────────────────────────────────────────────────────────────────
// Paleta de marca
// ────────────────────────────────────────────────────────────────────────────

const C = {
  // Marca
  brand: BRAND_BLUE, // azul intenso (hexágono): #1b38c4
  brandInk: BRAND_INK, // negro de marca: #0a0d1f
  brandSoft: '#eef2ff', // tinte muy claro del azul (callouts/objetivos)
  brandLime: '#c6f04d', // acento secundario
  brandLimeSoft: '#f5fadf',
  // Tipografía
  primary: BRAND_INK,
  body: '#1f2333',
  muted: '#5b6172',
  light: '#9aa0b2',
  rule: '#dfe3ec',
  bg: '#f7f8fc',
  white: '#ffffff',
  // Portada
  coverBg: '#0a0d1f',
  coverAccent: BRAND_BLUE,
  // Callouts
  exampleBg: '#e9f5ee',
  exampleBorder: '#1f9a59',
  exerciseBg: '#eef2ff',
  exerciseBorder: BRAND_BLUE,
  mistakesBg: '#fdf0ee',
  mistakesBorder: '#c14b3a',
  checklistBg: '#f0f3f8',
  checklistBorder: '#4b5468',
  keypointsBg: '#f5fadf',
  keypointsBorder: '#6f8f00',
};

// ────────────────────────────────────────────────────────────────────────────
// Estilos
// ────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Página genérica de contenido
  page: {
    fontFamily: FONT_BODY,
    fontSize: 10.5,
    color: C.body,
    paddingTop: 72,
    paddingBottom: 56,
    paddingHorizontal: 60,
  },
  // Cabecera y pie
  header: {
    position: 'absolute',
    top: 28,
    left: 60,
    right: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: C.rule,
    paddingBottom: 6,
  },
  headerCourse: {
    fontFamily: FONT_DISPLAY,
    fontSize: 8,
    color: C.muted,
    letterSpacing: 0.4,
  },
  headerModule: {
    fontFamily: FONT_DISPLAY,
    fontSize: 8,
    color: C.brand,
    letterSpacing: 0.4,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 60,
    right: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: C.rule,
    paddingTop: 6,
  },
  footerNum: {
    fontFamily: FONT_DISPLAY,
    fontSize: 8.5,
    color: C.light,
  },
  footerSite: {
    fontFamily: FONT_DISPLAY,
    fontSize: 8,
    color: C.light,
    letterSpacing: 0.3,
  },

  // ─── Cover ───
  coverPage: {
    fontFamily: FONT_DISPLAY,
    padding: 0,
  },
  coverTop: {
    backgroundColor: C.coverBg,
    height: '64%',
    justifyContent: 'flex-end',
    paddingHorizontal: 60,
    paddingBottom: 44,
  },
  coverKicker: {
    fontFamily: FONT_DISPLAY,
    fontSize: 9,
    fontWeight: 700,
    color: C.brandLime,
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
    marginBottom: 18,
  },
  coverTitle: {
    fontFamily: FONT_DISPLAY,
    fontSize: 30,
    fontWeight: 700,
    color: C.white,
    lineHeight: 1.18,
    marginBottom: 18,
  },
  coverDesc: {
    fontFamily: FONT_BODY,
    fontSize: 12,
    color: '#c7d2fe',
    lineHeight: 1.5,
    maxWidth: 420,
  },
  coverBottom: {
    height: '36%',
    paddingHorizontal: 60,
    paddingTop: 28,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  coverMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coverMetaBar: {
    width: 4,
    height: 32,
    backgroundColor: C.brand,
    marginRight: 14,
  },
  coverAuthor: {
    fontFamily: FONT_DISPLAY,
    fontSize: 13,
    fontWeight: 600,
    color: C.primary,
  },
  coverAuthorSub: {
    fontFamily: FONT_BODY,
    fontSize: 9.5,
    color: C.muted,
    marginTop: 2,
  },
  coverFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  coverCopy: {
    fontFamily: FONT_DISPLAY,
    fontSize: 7.5,
    color: C.light,
  },

  // ─── Legal ───
  legalPage: {
    fontFamily: FONT_BODY,
    paddingHorizontal: 60,
    paddingTop: 200,
    paddingBottom: 56,
  },
  legalTitle: {
    fontFamily: FONT_DISPLAY,
    fontSize: 14,
    fontWeight: 700,
    color: C.primary,
    marginBottom: 22,
  },
  legalText: {
    fontFamily: FONT_BODY,
    fontSize: 9.5,
    color: C.muted,
    lineHeight: 1.75,
  },

  // ─── How to use ───
  howToTitle: {
    fontFamily: FONT_DISPLAY,
    fontSize: 22,
    fontWeight: 700,
    color: C.primary,
    marginBottom: 4,
  },
  howToKicker: {
    fontFamily: FONT_DISPLAY,
    fontSize: 9,
    fontWeight: 700,
    color: C.brand,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  },
  howToRule: {
    width: 60,
    height: 3,
    backgroundColor: C.brand,
    marginBottom: 22,
  },
  howToIntro: {
    fontFamily: FONT_BODY,
    fontSize: 10.5,
    color: C.body,
    lineHeight: 1.6,
    marginBottom: 22,
  },
  howToBlock: {
    marginBottom: 16,
  },
  howToBlockLabel: {
    fontFamily: FONT_DISPLAY,
    fontSize: 9.5,
    fontWeight: 700,
    color: C.brand,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  howToBlockTitle: {
    fontFamily: FONT_DISPLAY,
    fontSize: 12,
    fontWeight: 600,
    color: C.primary,
    marginBottom: 4,
  },
  howToBlockBody: {
    fontFamily: FONT_BODY,
    fontSize: 10.5,
    color: C.body,
    lineHeight: 1.6,
  },

  // ─── TOC ───
  tocTitle: {
    fontFamily: FONT_DISPLAY,
    fontSize: 22,
    fontWeight: 700,
    color: C.primary,
    marginBottom: 4,
  },
  tocKicker: {
    fontFamily: FONT_DISPLAY,
    fontSize: 9,
    fontWeight: 700,
    color: C.brand,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  },
  tocRule: {
    width: '100%',
    height: 0.5,
    backgroundColor: C.rule,
    marginBottom: 18,
  },
  tocTopicRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
    marginBottom: 4,
  },
  tocTopicNum: {
    fontFamily: FONT_DISPLAY,
    fontSize: 10,
    fontWeight: 700,
    color: C.brand,
    marginRight: 8,
    minWidth: 22,
  },
  tocTopic: {
    fontFamily: FONT_DISPLAY,
    fontSize: 12,
    fontWeight: 700,
    color: C.primary,
    flex: 1,
  },
  tocLesson: {
    fontFamily: FONT_BODY,
    fontSize: 10,
    color: C.body,
    paddingLeft: 30,
    marginBottom: 3,
    textDecoration: 'none' as const,
  },

  // ─── Intro ───
  sectionTitle: {
    fontFamily: FONT_DISPLAY,
    fontSize: 22,
    fontWeight: 700,
    color: C.primary,
    marginBottom: 4,
  },
  sectionKicker: {
    fontFamily: FONT_DISPLAY,
    fontSize: 9,
    fontWeight: 700,
    color: C.brand,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  },
  sectionRule: {
    width: 50,
    height: 3,
    backgroundColor: C.brand,
    marginBottom: 20,
  },
  bodyText: {
    fontFamily: FONT_BODY,
    fontSize: 10.5,
    color: C.body,
    lineHeight: 1.65,
    marginBottom: 8,
    textAlign: 'left' as const,
  },

  // ─── Module Opening (full page) ───
  modOpeningPage: {
    fontFamily: FONT_DISPLAY,
    paddingHorizontal: 60,
    paddingTop: 90,
    paddingBottom: 60,
  },
  modOpeningNumber: {
    fontFamily: FONT_DISPLAY,
    fontSize: 120,
    fontWeight: 700,
    color: C.bg,
    lineHeight: 1,
    letterSpacing: -3,
    marginBottom: 8,
  },
  modOpeningKicker: {
    fontFamily: FONT_DISPLAY,
    fontSize: 10,
    fontWeight: 700,
    color: C.brand,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  },
  modOpeningTitle: {
    fontFamily: FONT_DISPLAY,
    fontSize: 26,
    fontWeight: 700,
    color: C.primary,
    lineHeight: 1.18,
    marginBottom: 14,
  },
  modOpeningLead: {
    fontFamily: FONT_BODY,
    fontSize: 11,
    color: C.body,
    lineHeight: 1.55,
    marginBottom: 28,
    maxWidth: 440,
  },
  modOpeningBlock: {
    marginBottom: 22,
  },
  modOpeningBlockLabel: {
    fontFamily: FONT_DISPLAY,
    fontSize: 9.5,
    fontWeight: 700,
    color: C.brand,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  modOpeningItem: {
    fontFamily: FONT_BODY,
    fontSize: 10.5,
    color: C.body,
    lineHeight: 1.55,
    marginBottom: 3,
  },
  modOpeningAccentBar: {
    width: 60,
    height: 4,
    backgroundColor: C.brandLime,
    marginBottom: 18,
  },

  // ─── Topic banner (sigue para coherencia con lecciones) ───
  topicBanner: {
    backgroundColor: C.brandSoft,
    borderLeftWidth: 4,
    borderLeftColor: C.brand,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 22,
  },
  topicBannerLabel: {
    fontFamily: FONT_DISPLAY,
    fontSize: 9,
    fontWeight: 700,
    color: C.brand,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
    marginBottom: 4,
  },
  topicTitle: {
    fontFamily: FONT_DISPLAY,
    fontSize: 16,
    fontWeight: 700,
    color: C.primary,
    lineHeight: 1.3,
  },

  // ─── Lesson ───
  lessonHeader: {
    marginTop: 22,
    marginBottom: 8,
  },
  lessonNumber: {
    fontFamily: FONT_DISPLAY,
    fontSize: 8.5,
    fontWeight: 700,
    color: C.brand,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    marginBottom: 3,
  },
  lessonTitle: {
    fontFamily: FONT_DISPLAY,
    fontSize: 13.5,
    fontWeight: 700,
    color: C.primary,
    lineHeight: 1.3,
  },
  lessonSep: {
    width: '100%',
    height: 0.5,
    backgroundColor: C.rule,
    marginTop: 14,
    marginBottom: 4,
  },

  // ─── Topic objectives (cabecera del módulo dentro de la primera página) ───
  topicObjectivesBox: {
    backgroundColor: C.bg,
    borderWidth: 0.5,
    borderColor: C.rule,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  topicObjectivesLabel: {
    fontFamily: FONT_DISPLAY,
    fontSize: 8.5,
    fontWeight: 700,
    color: C.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  topicObjectivesItem: {
    fontFamily: FONT_BODY,
    fontSize: 9.5,
    color: C.body,
    lineHeight: 1.55,
    marginBottom: 2,
  },

  // ─── Callouts ───
  callout: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
    marginTop: 12,
    marginBottom: 6,
  },
  calloutLabel: {
    fontFamily: FONT_DISPLAY,
    fontSize: 8.5,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  calloutText: {
    fontFamily: FONT_BODY,
    fontSize: 10,
    color: C.body,
    lineHeight: 1.6,
    marginBottom: 4,
  },
  calloutItem: {
    fontFamily: FONT_BODY,
    fontSize: 10,
    color: C.body,
    lineHeight: 1.55,
    marginBottom: 2,
  },

  // ─── Recap (cierre de módulo) ───
  recapBox: {
    marginTop: 28,
    paddingTop: 18,
    borderTopWidth: 0.5,
    borderTopColor: C.rule,
  },
  recapLabel: {
    fontFamily: FONT_DISPLAY,
    fontSize: 9.5,
    fontWeight: 700,
    color: C.brand,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  },
  recapTitle: {
    fontFamily: FONT_DISPLAY,
    fontSize: 14,
    fontWeight: 700,
    color: C.primary,
    marginBottom: 10,
  },
  recapItem: {
    fontFamily: FONT_BODY,
    fontSize: 10.5,
    color: C.body,
    lineHeight: 1.55,
    marginBottom: 3,
  },

  // ─── Glossary ───
  glossaryRow: {
    marginBottom: 10,
  },
  glossaryTerm: {
    fontFamily: FONT_DISPLAY,
    fontSize: 10.5,
    fontWeight: 700,
    color: C.brand,
    marginBottom: 2,
  },
  glossaryDef: {
    fontFamily: FONT_BODY,
    fontSize: 10,
    color: C.body,
    lineHeight: 1.55,
  },

  // ─── Back cover ───
  backPage: {
    fontFamily: FONT_DISPLAY,
    backgroundColor: C.coverBg,
    paddingTop: 84,
    paddingBottom: 60,
    paddingHorizontal: 60,
  },
  backAccentBar: {
    width: 60,
    height: 4,
    backgroundColor: C.brandLime,
    marginBottom: 22,
  },
  backKicker: {
    fontFamily: FONT_DISPLAY,
    fontSize: 9,
    fontWeight: 700,
    color: C.brandLime,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  },
  backHeadline: {
    fontFamily: FONT_DISPLAY,
    fontSize: 28,
    fontWeight: 700,
    color: C.white,
    lineHeight: 1.2,
    marginBottom: 16,
  },
  backLead: {
    fontFamily: FONT_BODY,
    fontSize: 12,
    color: '#c7d2fe',
    lineHeight: 1.55,
    marginBottom: 28,
    maxWidth: 460,
  },
  backSectionTitle: {
    fontFamily: FONT_DISPLAY,
    fontSize: 10.5,
    fontWeight: 700,
    color: C.white,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  backList: {
    marginBottom: 26,
  },
  backListItem: {
    fontFamily: FONT_BODY,
    fontSize: 10.5,
    color: '#dbe1ff',
    lineHeight: 1.55,
    marginBottom: 5,
  },
  backAboutBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderLeftWidth: 3,
    borderLeftColor: C.brandLime,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 26,
  },
  backAboutTitle: {
    fontFamily: FONT_DISPLAY,
    fontSize: 10,
    fontWeight: 700,
    color: C.white,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  backAboutText: {
    fontFamily: FONT_BODY,
    fontSize: 9.5,
    color: '#c7d2fe',
    lineHeight: 1.55,
  },
  backFooter: {
    position: 'absolute',
    bottom: 30,
    left: 60,
    right: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  backFooterUrl: {
    fontFamily: FONT_DISPLAY,
    fontSize: 11,
    fontWeight: 700,
    color: C.white,
  },
  backCopy: {
    fontFamily: FONT_DISPLAY,
    fontSize: 7.5,
    color: '#8b8fa8',
  },
});

// ────────────────────────────────────────────────────────────────────────────
// Componentes utilitarios
// ────────────────────────────────────────────────────────────────────────────

function PageHeader({
  courseTitle,
  moduleTitle,
}: {
  courseTitle: string;
  moduleTitle?: string;
}) {
  return (
    <View style={s.header} fixed>
      <Text style={s.headerCourse}>{safe(courseTitle)}</Text>
      {moduleTitle ? (
        <Text style={s.headerModule}>{safe(moduleTitle)}</Text>
      ) : (
        <Text style={s.headerCourse}>Recursalia</Text>
      )}
    </View>
  );
}

function PageFooter() {
  return (
    <View style={s.footer} fixed>
      <Text
        style={s.footerNum}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
      <Text style={s.footerSite}>recursalia.com</Text>
    </View>
  );
}

function Paragraphs({ text }: { text: string }) {
  const paras = safe(text).split(/\n\n+/).filter(Boolean);
  return (
    <>
      {paras.map((p, i) => (
        <Text key={i} style={s.bodyText}>
          {p.trim()}
        </Text>
      ))}
    </>
  );
}

function CalloutText({
  label,
  text,
  bg,
  border,
  labelColor,
}: {
  label: string;
  text: string;
  bg: string;
  border: string;
  labelColor: string;
}) {
  return (
    <View
      style={[s.callout, { backgroundColor: bg, borderLeftColor: border }]}
      wrap={false}
    >
      <Text style={[s.calloutLabel, { color: labelColor }]}>{label}</Text>
      {safe(text)
        .split(/\n\n+/)
        .filter(Boolean)
        .map((p, i) => (
          <Text key={i} style={s.calloutText}>
            {p.trim()}
          </Text>
        ))}
    </View>
  );
}

function CalloutList({
  label,
  items,
  bg,
  border,
  labelColor,
  numbered,
}: {
  label: string;
  items: string[];
  bg: string;
  border: string;
  labelColor: string;
  numbered?: boolean;
}) {
  return (
    <View
      style={[s.callout, { backgroundColor: bg, borderLeftColor: border }]}
      wrap={false}
    >
      <Text style={[s.calloutLabel, { color: labelColor }]}>{label}</Text>
      {items.map((it, i) => (
        <Text key={i} style={s.calloutItem}>
          {numbered ? `${i + 1}. ` : '· '}
          {safe(it)}
        </Text>
      ))}
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Páginas
// ────────────────────────────────────────────────────────────────────────────

function CoverPage({
  content,
  year,
}: {
  content: ExpandedCourseContent;
  year: number;
}) {
  const { name: coverAuthor } = resolveCourseAuthorDisplay(
    content.author_name,
    content.author_bio
  );
  return (
    <Page size="A4" style={s.coverPage}>
      <View style={s.coverTop}>
        <Text style={s.coverKicker}>Recursalia · Curso</Text>
        <Text style={s.coverTitle}>{safe(content.title)}</Text>
        {content.short_description && (
          <Text style={s.coverDesc}>{safe(content.short_description)}</Text>
        )}
      </View>
      <View style={s.coverBottom}>
        <View style={s.coverMetaRow}>
          <View style={s.coverMetaBar} />
          <View>
            <Text style={s.coverAuthor}>{safe(coverAuthor)}</Text>
            <Text style={s.coverAuthorSub}>Curso completo</Text>
          </View>
        </View>
        <View style={s.coverFooter}>
          <RecursaliaLockup height={26} />
          <Text style={s.coverCopy}>
            © {year} Recursalia. Todos los derechos reservados.
          </Text>
        </View>
      </View>
    </Page>
  );
}

function LegalPage({ title, year }: { title: string; year: number }) {
  return (
    <Page size="A4" style={s.legalPage}>
      <Text style={s.legalTitle}>{safe(title)}</Text>
      <Text style={s.legalText}>
        © {year} Recursalia. Todos los derechos reservados.
        {'\n\n'}
        Queda prohibida la reproducción total o parcial de esta obra, su
        incorporación a un sistema informático, su transmisión en cualquier
        forma o por cualquier medio, sea éste electrónico, mecánico, por
        fotocopia, por grabación u otros métodos, sin el permiso previo y por
        escrito del editor.
        {'\n\n'}
        Edición, revisión y distribución: Recursalia.
        {'\n'}
        recursalia.com
      </Text>
    </Page>
  );
}

function HowToUsePage({ courseTitle }: { courseTitle: string }) {
  return (
    <Page size="A4" style={s.page}>
      <PageHeader courseTitle={courseTitle} />
      <Text style={s.howToKicker}>Antes de empezar</Text>
      <Text style={s.howToTitle}>Cómo usar este manual</Text>
      <View style={s.howToRule} />
      <Text style={s.howToIntro}>
        Este curso combina lectura, ejemplos aplicados y ejercicios para que
        avances con criterio en cada módulo. Si lo quieres aprovechar al
        máximo, ten presente estos cinco bloques que verás repetidos en cada
        lección.
      </Text>

      <View style={s.howToBlock}>
        <Text style={s.howToBlockLabel}>Ejemplo</Text>
        <Text style={s.howToBlockTitle}>Casos concretos, no genéricos</Text>
        <Text style={s.howToBlockBody}>
          Cada lección incluye un caso protagonizado por una persona distinta,
          con su contexto y cifras. Léelos como si fueran clientes reales: lo
          aprendido en abstracto se asienta mucho más rápido sobre un ejemplo
          aterrizado.
        </Text>
      </View>

      <View style={s.howToBlock}>
        <Text style={s.howToBlockLabel}>Ejercicio práctico</Text>
        <Text style={s.howToBlockTitle}>Aplica lo aprendido</Text>
        <Text style={s.howToBlockBody}>
          Al terminar la lección encontrarás un ejercicio con un entregable
          claro. Hazlo aunque no sea obligatorio: es el momento en el que el
          conocimiento se convierte en habilidad.
        </Text>
      </View>

      <View style={s.howToBlock}>
        <Text style={s.howToBlockLabel}>Errores frecuentes</Text>
        <Text style={s.howToBlockTitle}>Lo que se suele hacer mal</Text>
        <Text style={s.howToBlockBody}>
          Te avisamos de los tropezones más habituales y de cómo prevenirlos.
          Saber qué evitar es tan importante como saber qué hacer.
        </Text>
      </View>

      <View style={s.howToBlock}>
        <Text style={s.howToBlockLabel}>Checklist</Text>
        <Text style={s.howToBlockTitle}>Confirma que lo dominas</Text>
        <Text style={s.howToBlockBody}>
          Una lista breve para autoevaluarte. Si puedes marcar todos los puntos
          con sinceridad, estás listo para la siguiente lección.
        </Text>
      </View>

      <View style={s.howToBlock}>
        <Text style={s.howToBlockLabel}>Puntos clave</Text>
        <Text style={s.howToBlockTitle}>La esencia en cinco ideas</Text>
        <Text style={s.howToBlockBody}>
          El cierre de cada lección: las ideas que merece la pena recordar para
          siempre. Útiles para repasar antes de cada examen, sesión o proyecto.
        </Text>
      </View>

      <PageFooter />
    </Page>
  );
}

function TocPage({
  content,
  courseTitle,
}: {
  content: ExpandedCourseContent;
  courseTitle: string;
}) {
  return (
    <Page size="A4" style={s.page}>
      <PageHeader courseTitle={courseTitle} />
      <Text style={s.tocKicker}>Índice</Text>
      <Text style={s.tocTitle}>Programa del curso</Text>
      <View style={s.tocRule} />
      {(content.topics ?? []).map((topic, ti) => (
        <View key={ti} wrap={false}>
          <Link src={`#topic-${ti}`} style={{ textDecoration: 'none' }}>
            <View style={s.tocTopicRow}>
              <Text style={s.tocTopicNum}>
                {String(ti + 1).padStart(2, '0')}
              </Text>
              <Text style={s.tocTopic}>{safe(topic.title)}</Text>
            </View>
          </Link>
          {topic.lessons.map((lesson, li) => (
            <Link
              key={li}
              src={`#topic-${ti}`}
              style={{ textDecoration: 'none' }}
            >
              <Text style={s.tocLesson}>
                {ti + 1}.{li + 1}  ·  {safe(lesson.title)}
              </Text>
            </Link>
          ))}
        </View>
      ))}
      <PageFooter />
    </Page>
  );
}

function IntroPage({
  content,
  courseTitle,
}: {
  content: ExpandedCourseContent;
  courseTitle: string;
}) {
  const intro = stripHtml(content.description ?? '');
  return (
    <Page size="A4" style={s.page}>
      <PageHeader courseTitle={courseTitle} />
      <Text style={s.sectionKicker}>Bienvenido</Text>
      <Text style={s.sectionTitle}>Introducción</Text>
      <View style={s.sectionRule} />
      {intro && <Paragraphs text={intro} />}
      <PageFooter />
    </Page>
  );
}

function ModuleOpeningPage({
  topic,
  modulePlan,
  index,
  totalModules,
  courseTitle,
}: {
  topic: ExpandedCourseContent['topics'][number];
  modulePlan?: ModulePlan;
  index: number;
  totalModules: number;
  courseTitle: string;
}) {
  const planObjectives = modulePlan?.objectives ?? topic.objectives ?? [];
  const summary = modulePlan?.summary ?? topic.summary ?? '';
  const definesHere = modulePlan?.definesHere ?? [];

  return (
    <Page size="A4" style={s.modOpeningPage} bookmark={`Módulo ${index + 1}: ${topic.title}`}>
      <PageHeader courseTitle={courseTitle} moduleTitle={topic.title} />
      <View id={`topic-${index}`}>
        <Text style={s.modOpeningNumber}>
          {String(index + 1).padStart(2, '0')}
        </Text>
        <Text style={s.modOpeningKicker}>
          Módulo {index + 1} de {totalModules}
        </Text>
        <Text style={s.modOpeningTitle}>{safe(topic.title)}</Text>
        <View style={s.modOpeningAccentBar} />
      </View>
      {summary ? <Text style={s.modOpeningLead}>{safe(summary)}</Text> : null}

      {planObjectives.length > 0 && (
        <View style={s.modOpeningBlock} wrap={false}>
          <Text style={s.modOpeningBlockLabel}>Objetivos de este módulo</Text>
          {planObjectives.map((o, i) => (
            <Text key={i} style={s.modOpeningItem}>
              · {safe(o)}
            </Text>
          ))}
        </View>
      )}

      {definesHere.length > 0 && (
        <View style={s.modOpeningBlock} wrap={false}>
          <Text style={s.modOpeningBlockLabel}>Qué cubre este módulo</Text>
          {definesHere.map((d, i) => (
            <Text key={i} style={s.modOpeningItem}>
              · {safe(d)}
            </Text>
          ))}
        </View>
      )}

      <PageFooter />
    </Page>
  );
}

function LessonBlock({
  lesson,
  showSep,
  number,
}: {
  lesson: ExpandedCourseContent['topics'][number]['lessons'][number];
  showSep: boolean;
  number: string;
}) {
  const hasRich =
    !!lesson.body ||
    !!lesson.example ||
    !!lesson.exercise ||
    (lesson.commonMistakes && lesson.commonMistakes.length > 0) ||
    (lesson.checklist && lesson.checklist.length > 0) ||
    (lesson.keyPoints && lesson.keyPoints.length > 0);

  if (!hasRich) {
    return (
      <View>
        {showSep && <View style={s.lessonSep} />}
        <View style={s.lessonHeader}>
          <Text style={s.lessonNumber}>Lección {number}</Text>
          <Text style={s.lessonTitle}>{safe(lesson.title)}</Text>
        </View>
        {lesson.content && <Paragraphs text={lesson.content} />}
      </View>
    );
  }

  return (
    <View>
      {showSep && <View style={s.lessonSep} />}
      <View style={s.lessonHeader} wrap={false}>
        <Text style={s.lessonNumber}>Lección {number}</Text>
        <Text style={s.lessonTitle}>{safe(lesson.title)}</Text>
      </View>
      {lesson.intro && <Paragraphs text={lesson.intro} />}
      {lesson.body && <Paragraphs text={lesson.body} />}
      {lesson.example && (
        <CalloutText
          label="Ejemplo"
          text={lesson.example}
          bg={C.exampleBg}
          border={C.exampleBorder}
          labelColor={C.exampleBorder}
        />
      )}
      {lesson.exercise && (
        <CalloutText
          label="Ejercicio práctico"
          text={lesson.exercise}
          bg={C.exerciseBg}
          border={C.exerciseBorder}
          labelColor={C.exerciseBorder}
        />
      )}
      {lesson.commonMistakes && lesson.commonMistakes.length > 0 && (
        <CalloutList
          label="Errores frecuentes"
          items={lesson.commonMistakes}
          bg={C.mistakesBg}
          border={C.mistakesBorder}
          labelColor={C.mistakesBorder}
        />
      )}
      {lesson.checklist && lesson.checklist.length > 0 && (
        <CalloutList
          label="Checklist"
          items={lesson.checklist}
          bg={C.checklistBg}
          border={C.checklistBorder}
          labelColor={C.checklistBorder}
        />
      )}
      {lesson.keyPoints && lesson.keyPoints.length > 0 && (
        <CalloutList
          label="Puntos clave"
          items={lesson.keyPoints}
          bg={C.keypointsBg}
          border={C.keypointsBorder}
          labelColor={C.keypointsBorder}
          numbered
        />
      )}
    </View>
  );
}

function TopicLessonsPage({
  topic,
  index,
  courseTitle,
  showRecap,
}: {
  topic: ExpandedCourseContent['topics'][number];
  index: number;
  courseTitle: string;
  showRecap: boolean;
}) {
  const hasObjectives = !!topic.objectives && topic.objectives.length > 0;
  const recapItems = (topic.lessons ?? [])
    .map((l) => l.keyPoints?.[0])
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0);

  return (
    <Page size="A4" style={s.page} wrap>
      <PageHeader courseTitle={courseTitle} moduleTitle={topic.title} />
      <View style={s.topicBanner} wrap={false}>
        <Text style={s.topicBannerLabel}>
          Módulo {String(index + 1).padStart(2, '0')}
        </Text>
        <Text style={s.topicTitle}>{safe(topic.title)}</Text>
      </View>
      {hasObjectives && (
        <View style={s.topicObjectivesBox} wrap={false}>
          <Text style={s.topicObjectivesLabel}>Objetivos del módulo</Text>
          {topic.objectives!.map((o, i) => (
            <Text key={i} style={s.topicObjectivesItem}>
              · {safe(o)}
            </Text>
          ))}
        </View>
      )}
      {topic.lessons.map((lesson, li) => (
        <LessonBlock
          key={li}
          lesson={lesson}
          showSep={li > 0}
          number={`${index + 1}.${li + 1}`}
        />
      ))}
      {showRecap && recapItems.length > 0 && (
        <View style={s.recapBox} wrap={false}>
          <Text style={s.recapLabel}>Cierre del módulo</Text>
          <Text style={s.recapTitle}>Lo que has aprendido</Text>
          {recapItems.map((it, i) => (
            <Text key={i} style={s.recapItem}>
              · {safe(it)}
            </Text>
          ))}
        </View>
      )}
      <PageFooter />
    </Page>
  );
}

function GlossaryPage({
  glossary,
  courseTitle,
}: {
  glossary: { term: string; definition: string }[];
  courseTitle: string;
}) {
  return (
    <Page size="A4" style={s.page}>
      <PageHeader courseTitle={courseTitle} />
      <Text style={s.sectionKicker}>Anexo</Text>
      <Text style={s.sectionTitle}>Glosario</Text>
      <View style={s.sectionRule} />
      {glossary.map((g, i) => (
        <View key={i} style={s.glossaryRow} wrap={false}>
          <Text style={s.glossaryTerm}>{safe(g.term)}</Text>
          <Text style={s.glossaryDef}>{safe(g.definition)}</Text>
        </View>
      ))}
      <PageFooter />
    </Page>
  );
}

function BackCoverPage({
  content,
  year,
}: {
  content: ExpandedCourseContent;
  year: number;
}) {
  const objectives = (content.editorialPlan?.globalObjectives ?? []).slice(0, 5);

  return (
    <Page size="A4" style={s.backPage}>
      <View style={s.backAccentBar} />
      <Text style={s.backKicker}>Has llegado al final</Text>
      <Text style={s.backHeadline}>Enhorabuena. Has completado el curso.</Text>
      <Text style={s.backLead}>
        Has recorrido un programa diseñado para llevarte de la teoría a la
        práctica con ejemplos reales, ejercicios aplicados y herramientas que
        puedes usar desde el primer día.
      </Text>

      {objectives.length > 0 && (
        <>
          <Text style={s.backSectionTitle}>Ahora eres capaz de</Text>
          <View style={s.backList}>
            {objectives.map((o, i) => (
              <Text key={i} style={s.backListItem}>
                · {safe(o)}
              </Text>
            ))}
          </View>
        </>
      )}

      <View style={s.backAboutBox}>
        <Text style={s.backAboutTitle}>Sobre Recursalia</Text>
        <Text style={s.backAboutText}>
          Recursalia es la plataforma de cursos prácticos diseñada para que
          aprendas habilidades aplicables a tu vida y a tu carrera, con
          contenidos cuidados y formación útil desde el primer minuto.
        </Text>
      </View>

      <View style={s.backFooter}>
        <View>
          <Text style={s.backFooterUrl}>recursalia.com</Text>
          <Text style={[s.backCopy, { marginTop: 4 }]}>
            © {year} Recursalia. Todos los derechos reservados.
          </Text>
        </View>
        <RecursaliaLockup
          height={24}
          markColor={C.white}
          wordmarkColor={C.white}
        />
      </View>
    </Page>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Documento
// ────────────────────────────────────────────────────────────────────────────

function CourseDocument({ content }: { content: ExpandedCourseContent }) {
  const year = new Date().getFullYear();
  const courseTitle = safe(content.title);
  const planModules = content.editorialPlan?.modules ?? [];
  const glossary = content.glossary ?? [];
  const totalModules = (content.topics ?? []).length;

  return (
    <Document title={courseTitle} author="Recursalia" subject={courseTitle}>
      <CoverPage content={content} year={year} />
      <LegalPage title={courseTitle} year={year} />
      <HowToUsePage courseTitle={courseTitle} />
      <TocPage content={content} courseTitle={courseTitle} />
      <IntroPage content={content} courseTitle={courseTitle} />
      {(content.topics ?? []).map((topic, i) => (
        <React.Fragment key={i}>
          <ModuleOpeningPage
            topic={topic}
            modulePlan={planModules[i]}
            index={i}
            totalModules={totalModules}
            courseTitle={courseTitle}
          />
          <TopicLessonsPage
            topic={topic}
            index={i}
            courseTitle={courseTitle}
            showRecap
          />
        </React.Fragment>
      ))}
      {glossary.length > 0 && (
        <GlossaryPage glossary={glossary} courseTitle={courseTitle} />
      )}
      <BackCoverPage content={content} year={year} />
    </Document>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// API pública
// ────────────────────────────────────────────────────────────────────────────

/**
 * Genera el PDF del curso. Los logos PNG ya no son necesarios (se reconstruye
 * el lockup Recursalia con SVG nativo), pero la firma se mantiene para no
 * romper llamadas existentes.
 */
export async function generateCoursePdf(
  content: ExpandedCourseContent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _logos?: PdfLogos
): Promise<Uint8Array> {
  const buffer = await renderToBuffer(<CourseDocument content={content} />);
  return new Uint8Array(buffer);
}

// Re-export para tests / depuración.
export { RecursaliaMark };
