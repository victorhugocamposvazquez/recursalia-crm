/**
 * Registro de tipografías editoriales para los PDFs (Hito 2).
 *
 * - **Inter** (sans humanista) → titulares, etiquetas, números.
 * - **Source Serif 4** (serif moderna) → cuerpo y bloques editoriales.
 *
 * Los archivos `.woff` viven en `public/fonts/` y se sirven desde el bundle
 * tanto en local como en Vercel (los assets de `public/` se incluyen en cada
 * función serverless de Next.js).
 *
 * Importar este módulo (solo importarlo) ya provoca el registro de fuentes
 * gracias al efecto lateral del fichero. Usar antes de renderizar cualquier
 * `<Document>`.
 */

import path from 'path';
import { Font } from '@react-pdf/renderer';

export const FONT_BODY = 'SourceSerif';
export const FONT_DISPLAY = 'Inter';

let registered = false;

export function registerPdfFonts(): void {
  if (registered) return;
  const fontsDir = path.join(process.cwd(), 'public', 'fonts');

  Font.register({
    family: FONT_DISPLAY,
    fonts: [
      { src: path.join(fontsDir, 'inter-400.woff'), fontWeight: 400 },
      { src: path.join(fontsDir, 'inter-600.woff'), fontWeight: 600 },
      { src: path.join(fontsDir, 'inter-700.woff'), fontWeight: 700 },
    ],
  });

  Font.register({
    family: FONT_BODY,
    fonts: [
      { src: path.join(fontsDir, 'source-serif-400.woff'), fontWeight: 400 },
      { src: path.join(fontsDir, 'source-serif-600.woff'), fontWeight: 600 },
    ],
  });

  /**
   * Desactiva la hifenación automática de @react-pdf (cortes feos tipo
   * "fundamen-" / "tales"). Preferimos cuerpos en `textAlign: left` sin
   * partir palabras.
   */
  Font.registerHyphenationCallback((word) => [word]);

  registered = true;
}
