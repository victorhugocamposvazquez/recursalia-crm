import { GoogleGenAI } from '@google/genai';
import type { GeneratedCourseStructure } from '@/types';

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

export async function generateCourseFeaturedImage(
  content: GeneratedCourseStructure
): Promise<Buffer> {
  const ai = getClient();
  const prompt = buildImagePrompt(content);

  const modelId =
    process.env.GEMINI_IMAGE_MODEL ?? 'gemini-2.5-flash-image';

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio: '16:9' },
    },
  });

  const resp = response as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }>;
      };
    }>;
  };
  const parts = resp.candidates?.[0]?.content?.parts ?? [];

  for (const part of parts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, 'base64');
    }
  }

  throw new Error('No image data in Gemini response');
}
