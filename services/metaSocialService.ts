/**
 * Publicación directa en Facebook Page e Instagram Business via Meta Graph API.
 */

const GRAPH_URL = 'https://graph.facebook.com/v21.0';

function getConfig() {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  const igId = process.env.META_INSTAGRAM_ID;
  if (!token) throw new Error('META_PAGE_ACCESS_TOKEN requerido');
  return { token, pageId, igId };
}

export interface SocialPostInput {
  message: string;
  link?: string;
  imageUrl?: string;
}

export interface SocialPostResult {
  id: string;
  platform: 'facebook' | 'instagram';
  url?: string;
}

export async function postToFacebook(
  input: SocialPostInput
): Promise<SocialPostResult> {
  const { token, pageId } = getConfig();
  if (!pageId) throw new Error('META_PAGE_ID requerido');

  let endpoint: string;
  let body: Record<string, string>;

  if (input.imageUrl) {
    endpoint = `${GRAPH_URL}/${pageId}/photos`;
    body = { url: input.imageUrl, message: input.message, access_token: token };
  } else {
    endpoint = `${GRAPH_URL}/${pageId}/feed`;
    body = { message: input.message, access_token: token };
    if (input.link) body.link = input.link;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Facebook API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { id?: string; post_id?: string };
  const postId = data.post_id ?? data.id ?? '';

  return {
    id: postId,
    platform: 'facebook',
    url: `https://www.facebook.com/${postId.replace('_', '/posts/')}`,
  };
}

export async function postToInstagram(
  input: SocialPostInput
): Promise<SocialPostResult> {
  const { token, igId } = getConfig();
  if (!igId) throw new Error('META_INSTAGRAM_ID requerido');
  if (!input.imageUrl) {
    throw new Error('Instagram requiere una imagen.');
  }

  const containerRes = await fetch(`${GRAPH_URL}/${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: input.imageUrl,
      caption: input.message,
      access_token: token,
    }),
  });

  if (!containerRes.ok) {
    const err = await containerRes.text();
    throw new Error(`Instagram container error ${containerRes.status}: ${err}`);
  }

  const { id: containerId } = (await containerRes.json()) as { id: string };

  const publishRes = await fetch(`${GRAPH_URL}/${igId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: token,
    }),
  });

  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`Instagram publish error ${publishRes.status}: ${err}`);
  }

  const { id: mediaId } = (await publishRes.json()) as { id: string };

  return {
    id: mediaId,
    platform: 'instagram',
  };
}

/**
 * Publica en Facebook e Instagram simultáneamente.
 * Si una falla, devuelve el resultado parcial + error.
 */
export async function postToBoth(
  input: SocialPostInput
): Promise<{ facebook?: SocialPostResult; instagram?: SocialPostResult; errors: string[] }> {
  const { pageId, igId } = getConfig();
  const errors: string[] = [];
  let facebook: SocialPostResult | undefined;
  let instagram: SocialPostResult | undefined;

  const promises: Promise<void>[] = [];

  if (pageId) {
    promises.push(
      postToFacebook(input)
        .then((r) => { facebook = r; })
        .catch((e) => { errors.push(`Facebook: ${e instanceof Error ? e.message : String(e)}`); })
    );
  }

  if (igId && input.imageUrl) {
    promises.push(
      postToInstagram(input)
        .then((r) => { instagram = r; })
        .catch((e) => { errors.push(`Instagram: ${e instanceof Error ? e.message : String(e)}`); })
    );
  } else if (igId && !input.imageUrl) {
    errors.push('Instagram: No se pudo publicar (requiere imagen)');
  }

  await Promise.all(promises);

  return { facebook, instagram, errors };
}

export function buildCoursePostMessage(
  title: string,
  shortDescription: string,
  courseUrl?: string
): string {
  const lines: string[] = [];
  lines.push(title);
  lines.push('');
  if (shortDescription) lines.push(shortDescription);
  if (courseUrl) {
    lines.push('');
    lines.push(courseUrl);
  }
  lines.push('');
  lines.push('#recursalia #cursosonline #formacion #educacion');
  return lines.join('\n');
}
