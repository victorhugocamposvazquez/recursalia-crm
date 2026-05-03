import type { MetadataRoute } from 'next';
import { siteCanonicalBase } from '@/lib/blog-seo';

export default function robots(): MetadataRoute.Robots {
  const base = siteCanonicalBase();
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${base}/sitemap.xml`,
    host: base.replace(/^https?:\/\//, ''),
  };
}
