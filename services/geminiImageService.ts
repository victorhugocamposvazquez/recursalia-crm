import { GoogleGenAI } from '@google/genai';
import type { GeneratedCourseStructure } from '@/types';
import { logGeminiImageUsage } from '@/services/aiUsageLogService';

function getClient(): GoogleGenAI {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) throw new Error('GOOGLE_GEMINI_API_KEY required');
  return new GoogleGenAI({ apiKey: key });
}

function buildImagePrompt(content: GeneratedCourseStructure): string {
  const { title, short_description } = content;
  return `Create a single professional hero image that visually evokes the TOPIC of an online course. Use the following only as semantic context for subject matter — do NOT write, spell, render, or suggest any words, titles, captions, typography, logos, brand marks, or readable characters anywhere in the image.

Course context (ideas only): ${short_description || title}

Requirements:
- Purely illustrative: objects, scenes, atmosphere, metaphors related to learning that topic. Abstract or concrete is fine.
- Absolutely NO text on the image (no headings, subtitles, badges, fake UI panels with letters).
- Modern, clean, professional; suitable as a generic education/catalog thumbnail.
- High quality photorealistic or crisp illustration — not a cluttered collage.
Aspect: Wide banner 16:9 for a course hero.`;
}

type GenContentPart = {
  text?: string;
  inlineData?: { data?: string; mimeType?: string };
  /** Algunas respuestas REST/SDK devuelven snake_case */
  inline_data?: { data?: string; mime_type?: string };
};

function extractImageBuffer(response: unknown): Buffer | null {
  const resp = response as {
    promptFeedback?: { blockReason?: string; block_reason?: string };
    candidates?: Array<{ content?: { parts?: GenContentPart[] } }>;
  };
  const block =
    resp.promptFeedback?.blockReason ?? resp.promptFeedback?.block_reason;
  if (block) {
    throw new Error(`Gemini bloqueo la solicitud (${block}). Prueba otro modelo o revisa políticas de la API.`);
  }

  for (const cand of resp.candidates ?? []) {
    for (const part of cand.content?.parts ?? []) {
      const b64 = part.inlineData?.data ?? part.inline_data?.data;
      if (b64) return Buffer.from(b64, 'base64');
    }
  }
  return null;
}

function formatGeminiClientError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (/429|"code"\s*:\s*429|quota|rate.?limit/i.test(raw)) {
    return [
      'Google Gemini rechazo la peticion por CUOTA / limite del plan (HTTP 429).',
      'En AI Studio usa «Configurar la facturacion» para pagar uso o espera el reinicio de la cuota gratuita.',
      'Documentacion de limites: https://ai.google.dev/gemini-api/docs/rate-limits',
    ].join(' ');
  }
  if (raw.length > 380) return `${raw.slice(0, 380)}…`;
  return raw;
}

export async function generateCourseFeaturedImage(
  content: GeneratedCourseStructure,
  courseId?: string | null
): Promise<Buffer> {
  const ai = getClient();
  const prompt = buildImagePrompt(content);

  const modelId =
    process.env.GEMINI_IMAGE_MODEL ?? 'gemini-2.5-flash-image';

  /**
   * Documentación oficial gemini-2.5-flash-image (JS): solo `imageConfig`, sin responseModalities.
   * Pasar responseModalities con TEXT+IMAGE en 2.5 a veces deja respuesta solo texto → "no regenerate".
   */
  let response: unknown;
  try {
    response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        imageConfig: { aspectRatio: '16:9' },
      },
    });
  } catch (err) {
    throw new Error(formatGeminiClientError(err));
  }

  try {
    const buf = extractImageBuffer(response);
    if (buf && buf.length > 0) {
      logGeminiImageUsage(
        'course_featured_image',
        modelId,
        courseId,
        1
      );
      return buf;
    }

    const parts = (
      response as { candidates?: Array<{ content?: { parts?: GenContentPart[] } }> }
    ).candidates?.[0]?.content?.parts ?? [];
    const firstText = parts.map((p) => p.text).filter(Boolean)[0];
    if (firstText) {
      const t = String(firstText);
      if (/429|"code"\s*:\s*429|quota|rate.?limit/i.test(t)) {
        throw new Error(formatGeminiClientError(new Error(t)));
      }
      throw new Error(
        `Gemini no devolvio imagen (solo texto): ${t.slice(0, 280)}`,
      );
    }
    throw new Error(
      'No image data in Gemini response. Comprueba el modelo en AI Studio y que soporte generacion nativa.',
    );
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Gemini bloqueo')) throw e;
    throw new Error(formatGeminiClientError(e));
  }
}
