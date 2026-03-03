import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import type { ExpandedCourseContent } from '@/services/openaiEbookService';

export interface PdfLogos {
  recursalia?: Uint8Array;
  hotmart?: Uint8Array;
}

function toDataUri(bytes: Uint8Array): string {
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  const mime = isJpeg ? 'image/jpeg' : 'image/png';
  const b64 = Buffer.from(bytes).toString('base64');
  return `data:${mime};base64,${b64}`;
}

function safe(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[^\x00-\x7F\xA0-\xFF\n]/g, '').trim();
}

const C = {
  primary: '#1a1b3a',
  accent: '#4f46e5',
  accentLight: '#818cf8',
  accentBg: '#eef2ff',
  body: '#2d2d3a',
  muted: '#6b7280',
  light: '#9ca3af',
  rule: '#d1d5db',
  bg: '#f8f9fa',
  white: '#ffffff',
  coverBg: '#1e1b4b',
  coverAccent: '#6366f1',
  topicBg: '#f0f0ff',
};

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.body,
    paddingTop: 70,
    paddingBottom: 56,
    paddingHorizontal: 56,
  },
  header: {
    position: 'absolute',
    top: 28,
    left: 56,
    right: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: C.rule,
    paddingBottom: 6,
  },
  headerText: {
    fontSize: 7,
    color: C.light,
    fontFamily: 'Helvetica-Oblique',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 56,
    right: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: C.rule,
    paddingTop: 6,
  },
  footerNum: {
    fontSize: 8,
    color: C.light,
  },

  // Cover
  coverPage: {
    fontFamily: 'Helvetica',
    padding: 0,
  },
  coverTop: {
    backgroundColor: C.coverBg,
    height: '58%',
    justifyContent: 'flex-end',
    paddingHorizontal: 56,
    paddingBottom: 40,
  },
  coverAccentBar: {
    width: 60,
    height: 4,
    backgroundColor: C.coverAccent,
    marginBottom: 20,
  },
  coverTitle: {
    fontSize: 30,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    lineHeight: 1.25,
    marginBottom: 14,
  },
  coverDesc: {
    fontSize: 12,
    color: '#c7d2fe',
    lineHeight: 1.5,
    maxWidth: 400,
  },
  coverBottom: {
    height: '42%',
    paddingHorizontal: 56,
    paddingTop: 30,
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  coverAuthor: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
  },
  coverAuthorSub: {
    fontSize: 9,
    color: C.muted,
    marginTop: 3,
  },
  coverLogos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  coverLogo: {
    maxWidth: 130,
    maxHeight: 38,
    objectFit: 'contain' as const,
  },
  coverCopy: {
    fontSize: 7,
    color: C.light,
  },

  // Legal
  legalPage: {
    fontFamily: 'Helvetica',
    paddingHorizontal: 56,
    paddingTop: 200,
    paddingBottom: 56,
  },
  legalTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    marginBottom: 24,
  },
  legalText: {
    fontSize: 9,
    color: C.muted,
    lineHeight: 1.8,
  },

  // TOC
  tocTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    marginBottom: 6,
  },
  tocRule: {
    width: '100%',
    height: 1,
    backgroundColor: C.rule,
    marginBottom: 20,
  },
  tocTopic: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    marginTop: 10,
    marginBottom: 4,
  },
  tocLesson: {
    fontSize: 9.5,
    color: C.body,
    paddingLeft: 16,
    marginBottom: 3,
  },

  // Intro
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    marginBottom: 6,
  },
  sectionRule: {
    width: 50,
    height: 3,
    backgroundColor: C.accent,
    marginBottom: 18,
  },
  bodyText: {
    fontSize: 10,
    color: C.body,
    lineHeight: 1.7,
    marginBottom: 8,
    textAlign: 'justify' as const,
  },

  // Topic banner
  topicBanner: {
    backgroundColor: C.accentBg,
    borderLeftWidth: 4,
    borderLeftColor: C.accent,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  topicTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    lineHeight: 1.3,
  },

  // Lesson
  lessonTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: C.accent,
    marginBottom: 8,
    marginTop: 20,
  },
  lessonSep: {
    width: '100%',
    height: 0.5,
    backgroundColor: C.rule,
    marginTop: 16,
    marginBottom: 4,
  },

  // Back cover
  backPage: {
    fontFamily: 'Helvetica',
    backgroundColor: C.coverBg,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backLogoWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  backLogo: {
    maxWidth: 200,
    maxHeight: 60,
    objectFit: 'contain' as const,
    marginBottom: 16,
  },
  backCopy: {
    fontSize: 8,
    color: '#8b8fa8',
    position: 'absolute',
    bottom: 30,
  },
});

// ─── Components ────────────────────────────────────

function PageHeader({ title }: { title: string }) {
  return (
    <View style={s.header} fixed>
      <Text style={s.headerText}>{safe(title)}</Text>
      <Text style={s.headerText}>Recursalia</Text>
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

function CoverPage({
  content,
  recLogoUri,
  hotLogoUri,
  year,
}: {
  content: ExpandedCourseContent;
  recLogoUri?: string;
  hotLogoUri?: string;
  year: number;
}) {
  return (
    <Page size="A4" style={s.coverPage}>
      <View style={s.coverTop}>
        <View style={s.coverAccentBar} />
        <Text style={s.coverTitle}>{safe(content.title)}</Text>
        {content.short_description && (
          <Text style={s.coverDesc}>{safe(content.short_description)}</Text>
        )}
      </View>
      <View style={s.coverBottom}>
        <View>
          {content.author_name && (
            <Text style={s.coverAuthor}>{safe(content.author_name)}</Text>
          )}
          <Text style={s.coverAuthorSub}>Curso completo</Text>
        </View>
        <View style={s.coverLogos}>
          <View>
            {recLogoUri ? (
              <Image src={recLogoUri} style={s.coverLogo} />
            ) : (
              <Text style={{ fontSize: 10, color: C.muted }}>Recursalia</Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {hotLogoUri ? (
              <Image src={hotLogoUri} style={s.coverLogo} />
            ) : (
              <Text style={{ fontSize: 9, color: C.light }}>Hotmart</Text>
            )}
            <Text style={s.coverCopy}>
              {year} Recursalia. Todos los derechos reservados.
            </Text>
          </View>
        </View>
      </View>
    </Page>
  );
}

function LegalPage({
  title,
  year,
}: {
  title: string;
  year: number;
}) {
  return (
    <Page size="A4" style={s.legalPage}>
      <Text style={s.legalTitle}>{safe(title)}</Text>
      <Text style={s.legalText}>
        {`(c) ${year} Recursalia. Todos los derechos reservados.

Queda prohibida la reproduccion total o parcial de este libro, su incorporacion a un sistema informatico, su transmision en cualquier forma o por cualquier medio, sea este electronico, mecanico, por fotocopia, por grabacion u otros metodos, sin el permiso previo y por escrito del editor.

Publicado y distribuido a traves de Hotmart.
Revisado profesionalmente por la plataforma Recursalia.
recursalia.com`}
      </Text>
    </Page>
  );
}

function TocPage({ content }: { content: ExpandedCourseContent }) {
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.tocTitle}>Indice</Text>
      <View style={s.tocRule} />
      {(content.topics ?? []).map((topic, ti) => (
        <View key={ti} wrap={false}>
          <Text style={s.tocTopic}>{safe(topic.title)}</Text>
          {topic.lessons.map((lesson, li) => (
            <Text key={li} style={s.tocLesson}>
              {safe(lesson.title)}
            </Text>
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
  return (
    <Page size="A4" style={s.page}>
      <PageHeader title={courseTitle} />
      <Text style={s.sectionTitle}>Introduccion</Text>
      <View style={s.sectionRule} />
      {content.description && <Paragraphs text={content.description} />}
      <PageFooter />
    </Page>
  );
}

function TopicPages({
  topic,
  courseTitle,
}: {
  topic: ExpandedCourseContent['topics'][number];
  courseTitle: string;
}) {
  return (
    <Page size="A4" style={s.page} wrap>
      <PageHeader title={courseTitle} />
      <View style={s.topicBanner} wrap={false}>
        <Text style={s.topicTitle}>{safe(topic.title)}</Text>
      </View>
      {topic.lessons.map((lesson, li) => (
        <View key={li} wrap={false}>
          {li > 0 && <View style={s.lessonSep} />}
          <Text style={s.lessonTitle}>{safe(lesson.title)}</Text>
          {lesson.content && <Paragraphs text={lesson.content} />}
        </View>
      ))}
      <PageFooter />
    </Page>
  );
}

function BackCoverPage({
  recLogoUri,
  hotLogoUri,
  year,
}: {
  recLogoUri?: string;
  hotLogoUri?: string;
  year: number;
}) {
  return (
    <Page size="A4" style={s.backPage}>
      <View style={s.backLogoWrap}>
        {recLogoUri && <Image src={recLogoUri} style={s.backLogo} />}
        {hotLogoUri && (
          <Image
            src={hotLogoUri}
            style={[s.backLogo, { maxWidth: 160, maxHeight: 50 }]}
          />
        )}
      </View>
      <Text style={s.backCopy}>
        {year} Recursalia. Todos los derechos reservados.
      </Text>
    </Page>
  );
}

// ─── Main document ─────────────────────────────────

function CourseDocument({
  content,
  recLogoUri,
  hotLogoUri,
}: {
  content: ExpandedCourseContent;
  recLogoUri?: string;
  hotLogoUri?: string;
}) {
  const year = new Date().getFullYear();
  const courseTitle = safe(content.title);

  return (
    <Document title={courseTitle} author="Recursalia" subject={courseTitle}>
      <CoverPage
        content={content}
        recLogoUri={recLogoUri}
        hotLogoUri={hotLogoUri}
        year={year}
      />
      <LegalPage title={courseTitle} year={year} />
      <TocPage content={content} />
      <IntroPage content={content} courseTitle={courseTitle} />
      {(content.topics ?? []).map((topic, i) => (
        <TopicPages key={i} topic={topic} courseTitle={courseTitle} />
      ))}
      <BackCoverPage
        recLogoUri={recLogoUri}
        hotLogoUri={hotLogoUri}
        year={year}
      />
    </Document>
  );
}

// ─── Public API ────────────────────────────────────

export async function generateCoursePdf(
  content: ExpandedCourseContent,
  logos?: PdfLogos
): Promise<Uint8Array> {
  const recLogoUri = logos?.recursalia?.length
    ? toDataUri(logos.recursalia)
    : undefined;
  const hotLogoUri = logos?.hotmart?.length
    ? toDataUri(logos.hotmart)
    : undefined;

  const buffer = await renderToBuffer(
    <CourseDocument
      content={content}
      recLogoUri={recLogoUri}
      hotLogoUri={hotLogoUri}
    />
  );

  return new Uint8Array(buffer);
}
