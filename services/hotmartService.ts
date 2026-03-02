import type {
  HotmartTokenResponse,
  HotmartCreateProductPayload,
  HotmartProductResponse,
} from '@/types/hotmart';
import { withRetry } from '@/utils/retry';

const HOTMART_CLIENT_ID = process.env.HOTMART_CLIENT_ID!;
const HOTMART_CLIENT_SECRET = process.env.HOTMART_CLIENT_SECRET!;
const TOKEN_URL = 'https://api-sec-vlc.hotmart.com/security/oauth/token';
// Alternativa: https://api-hot-connect.hotmart.com/product/rest/v2/products
const PRODUCTS_URL =
  process.env.HOTMART_PRODUCTS_URL ??
  'https://api-hot-connect.hotmart.com/product/rest/v2/products';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (!HOTMART_CLIENT_ID || !HOTMART_CLIENT_SECRET) {
    throw new Error('Hotmart env vars required: HOTMART_CLIENT_ID, HOTMART_CLIENT_SECRET');
  }

  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const basicAuth = Buffer.from(
    `${HOTMART_CLIENT_ID}:${HOTMART_CLIENT_SECRET}`
  ).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Hotmart OAuth failed: ${res.status} - ${text}`);
  }

  const data = (await res.json()) as HotmartTokenResponse;
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

export async function createProduct(
  name: string,
  description: string,
  price: number
): Promise<string> {
  const token = await getAccessToken();

  const payload: HotmartCreateProductPayload = {
    name,
    description,
    price,
    benefits: description.slice(0, 500),
  };

  const result = await withRetry(
    async () => {
      const res = await fetch(PRODUCTS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as HotmartProductResponse & {
        product?: { id?: string };
      };

      if (!res.ok) {
        throw new Error(
          `Hotmart API error ${res.status}: ${JSON.stringify(data)}`
        );
      }

      const productId =
        (data as HotmartProductResponse).id ?? data.product?.id;
      if (!productId) {
        throw new Error('Hotmart did not return product id');
      }

      return String(productId);
    },
    { maxRetries: 3, delayMs: 2000 }
  );

  return result;
}
