import { GoogleGenAI } from '@google/genai';
import type { GeneratedCourseStructure } from '@/types';

function getClient(): GoogleGenAI {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) throw new Error('GOOGLE_GEMINI_API_KEY required');
  return new GoogleGenAI({ apiKey: key });
}

function buildImagePrompt(content: GeneratedCourseStructure): string {
  const { title, short_description } = content;
  return `Generate a professional featured image for an online course titled "${title}".

Context: ${short_description || title}

Style: Modern, clean, professional. Suitable for an educational platform. High quality, no text overlay. 
Aspect: Wide/banner style (16:9) for course hero image.`;
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
