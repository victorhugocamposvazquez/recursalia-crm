/**
 * Placeholder genérico para `next/image` con `placeholder="blur"`.
 * SVG mínimo (gradiente cálido coherente con la marca) codificado en base64.
 */
const RAW_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 10"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#d9f3fc"/><stop offset="100%" stop-color="#fdf1d3"/></linearGradient></defs><rect width="16" height="10" fill="url(#g)"/></svg>';

export const COURSE_IMAGE_BLUR_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(
  RAW_SVG
).toString('base64')}`;
