import type { WpCreateCoursePayload, WpCourseResponse } from '@/types/wordpress';
import type { GeneratedCourseStructure, CourseInputPayload } from '@/types';
import { withRetry } from '@/utils/retry';
import { PartialPublishError } from '@/utils/partialPublishError';
import { createCurriculum } from './tutorLmsService';
import { setCourseProduct } from './wordpressCourseMetaService';

export interface WpMediaResponse {
  id: number;
  source_url: string;
}

function getConfig() {
  const url = process.env.WORDPRESS_URL;
  const user = process.env.WORDPRESS_USER;
  const appPassword = process.env.WORDPRESS_APP_PASSWORD;
  if (!url || !user || !appPassword) throw new Error('WordPress env vars required');
  return {
    url,
    authHeader: `Basic ${Buffer.from(`${user}:${appPassword}`).toString('base64')}`,
  };
}

function buildCourseHtmlContent(content: GeneratedCourseStructure): string {
  return content.description ?? '';
}

export async function uploadMedia(
  buffer: Buffer,
  filename: string,
  mimeType: string = 'image/png'
): Promise<number> {
  const { url, authHeader } = getConfig();

  const res = await fetch(`${url}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WordPress media upload error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as WpMediaResponse;
  return data.id;
}

export async function createCourse(
  content: GeneratedCourseStructure,
  hotmartUrl?: string,
  featuredImageBuffer?: Buffer,
  woocommerceProductId?: number,
  inputPayload?: CourseInputPayload
): Promise<number> {
  const { url, authHeader } = getConfig();
  const htmlContent = buildCourseHtmlContent(content);

  let featuredMediaId: number | undefined;
  if (featuredImageBuffer && featuredImageBuffer.length > 0) {
    try {
      featuredMediaId = await withRetry(
        () =>
          uploadMedia(
            featuredImageBuffer,
            `course-${Date.now()}.png`,
            'image/png'
          ),
        { maxRetries: 2, delayMs: 1000 }
      );
    } catch {
      // Continue without featured image
    }
  }

  // eslint-disable-next-line no-control-regex
  const safeTitle = content.title.replace(/[^\x00-\x7F\xA0-\xFF]/g, '').trim();

  const isCourse = (inputPayload?.productType ?? 'course') === 'course';
  const isBestSeller = inputPayload?.bestSeller !== false;

  const payload: WpCreateCoursePayload = {
    title: safeTitle,
    content: htmlContent,
    excerpt: content.short_description ?? '',
    status: 'publish',
    ...(featuredMediaId && { featured_media: featuredMediaId }),
    meta: {
      tlcf_short_description: content.short_description ?? '',
      tlcf_best_seller: isBestSeller ? 'si' : 'no',
      tlcf_ventajas_curso: isCourse ? 'si' : 'no',
      tlcf_guide_benefits: isCourse ? 'no' : 'si',
      tlcf_salary_info: content.highlight ?? '',
      tlcf_hotmart_link: typeof hotmartUrl === 'string' ? hotmartUrl : '',
    },
  };

  const courseId = await withRetry(
    async () => {
      const res = await fetch(`${url}/wp-json/wp/v2/courses`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`WordPress API error ${res.status}: ${text}`);
      }

      const data = (await res.json()) as WpCourseResponse;
      return data.id;
    },
    { maxRetries: 3, delayMs: 1500 }
  );

  const errors: string[] = [];
  let productFailed = false;
  let curriculumFailed = false;

  if (woocommerceProductId) {
    try {
      await setCourseProduct(courseId, woocommerceProductId);
    } catch (err) {
      productFailed = true;
      errors.push(`Producto: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (content.topics?.length) {
    try {
      await createCurriculum(courseId, content);
    } catch (err) {
      curriculumFailed = true;
      errors.push(`Temario: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (errors.length > 0) {
    throw new PartialPublishError(
      errors.join(' | '),
      courseId,
      productFailed,
      curriculumFailed
    );
  }

  return courseId;
}
