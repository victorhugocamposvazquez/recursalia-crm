/**
 * Servicio para establecer meta del curso en WordPress.
 * La API REST de wp/v2/courses puede no guardar meta personalizado como _tutor_course_product_id,
 * por eso usamos el endpoint del plugin Recursalia que hace update_post_meta directamente.
 */

function getConfig() {
  const url = process.env.WORDPRESS_URL;
  const user = process.env.WORDPRESS_USER;
  const appPassword = process.env.WORDPRESS_APP_PASSWORD;
  if (!url || !user || !appPassword)
    throw new Error('WordPress env vars required');
  return {
    url,
    authHeader: `Basic ${Buffer.from(`${user}:${appPassword}`).toString('base64')}`,
  };
}

export async function setCourseProduct(
  courseId: number,
  woocommerceProductId: number
): Promise<void> {
  const { url, authHeader } = getConfig();

  const res = await fetch(`${url}/wp-json/recursalia/v1/course-set-product`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      course_id: courseId,
      product_id: woocommerceProductId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Set course product error ${res.status}: ${text}`);
  }
}

/**
 * Actualiza el enlace de pago de Hotmart del curso en WordPress.
 * Hotmart no tiene API para crear productos; el usuario crea el producto a mano y pega aquí el enlace.
 */
export async function setCourseHotmartLink(
  wpCourseId: number,
  hotmartUrl: string
): Promise<void> {
  const { url, authHeader } = getConfig();
  const res = await fetch(`${url}/wp-json/wp/v2/courses/${wpCourseId}`, {
    method: 'PATCH',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ meta: { hotmart_link: hotmartUrl.trim() } }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update Hotmart link error ${res.status}: ${text}`);
  }
}
