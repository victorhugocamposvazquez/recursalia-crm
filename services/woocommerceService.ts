/**
 * WooCommerce REST API - creación de productos para cursos Tutor LMS.
 * Requiere: WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET
 * Generar en: WooCommerce > Configuración > Avanzado > API REST
 */

const WOOCOMMERCE_URL = process.env.WORDPRESS_URL;
const CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

function getWooAuth(): string {
  if (!WOOCOMMERCE_URL || !CONSUMER_KEY || !CONSUMER_SECRET) {
    throw new Error('WooCommerce env vars required: WORDPRESS_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET');
  }
  return `Basic ${Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')}`;
}

export interface WooProductInput {
  name: string;
  description?: string;
  short_description?: string;
  regular_price: number;
  sale_price?: number;
}

export interface WooProductResponse {
  id: number;
  name: string;
  price: string;
  regular_price: string;
  sale_price: string;
}

export async function createProduct(input: WooProductInput): Promise<number> {
  const url = WOOCOMMERCE_URL!;
  const authHeader = getWooAuth();

  const body: Record<string, unknown> = {
    name: input.name,
    type: 'simple',
    virtual: true,
    purchasable: true,
    regular_price: String(input.regular_price),
    status: 'publish',
  };

  if (input.description) body.description = input.description;
  if (input.short_description) body.short_description = input.short_description;
  if (
    input.sale_price != null &&
    input.sale_price > 0 &&
    input.sale_price < input.regular_price
  ) {
    body.sale_price = String(input.sale_price);
  }

  const res = await fetch(`${url}/wp-json/wc/v3/products`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WooCommerce API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as WooProductResponse;
  return data.id;
}
