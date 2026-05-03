/** Appends UTM (and opcional contenido medio) sin romper query strings existentes (p. ej. Hotmart). */
export type UtmChannel =
  | 'course_landing'
  | 'social_facebook'
  | 'social_instagram'
  | 'blog';

const DEFAULT_SOURCE = process.env.TRACK_UTM_SOURCE ?? 'recursalia';

/** Mapa medio/campaña por contexto si no overrides en URL. */
const CHANNEL_PARAMS: Record<
  UtmChannel,
  { utm_medium: string; utm_campaign: string }
> = {
  course_landing: { utm_medium: 'landing', utm_campaign: 'curso-checkout' },
  social_facebook: { utm_medium: 'social', utm_campaign: 'meta-facebook' },
  social_instagram: { utm_medium: 'social', utm_campaign: 'meta-instagram' },
  blog: { utm_medium: 'referral', utm_campaign: 'blog-post' },
};

export function appendUtm(url: string, channel: UtmChannel): string {
  const raw = url?.trim();
  if (!raw || !/^https?:\/\//i.test(raw)) return url;

  if (process.env.TRACK_UTM_DISABLED === 'true') return url;

  const source =
    process.env.TRACK_UTM_SOURCE?.trim() || DEFAULT_SOURCE.trim() || 'recursalia';

  try {
    const u = new URL(raw);
    const base = CHANNEL_PARAMS[channel];
    if (!u.searchParams.has('utm_source')) {
      u.searchParams.set('utm_source', source);
    }
    if (!u.searchParams.has('utm_medium')) {
      u.searchParams.set('utm_medium', base.utm_medium);
    }
    if (!u.searchParams.has('utm_campaign')) {
      u.searchParams.set('utm_campaign', base.utm_campaign);
    }
    return u.toString();
  } catch {
    return url;
  }
}
