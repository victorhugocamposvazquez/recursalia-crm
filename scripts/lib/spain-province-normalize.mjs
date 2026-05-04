/**
 * Normaliza texto que debería ser nombre de provincia (España), incluidas
 * variantes OCR y abreviaturas ("CORU A", "A CORU", "Coruña" → "A Coruña").
 */

function stripDiacritics(s) {
  return s.normalize('NFD').replace(/\p{M}/gu, '');
}

/** Clave de búsqueda: minúsculas, sin tilde, solo letras/espacios colapsados */
function squash(s) {
  return stripDiacritics(String(s ?? ''))
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Pares [canónico INE habitual, alias…] para construir mapa squash → canónico */
const PROVINCE_GROUPS = [
  ['A Coruña', 'la coruna', 'la coruña', 'coruna', 'coruña', 'acoruna'],
  ['Albacete', 'albacete'],
  ['Alicante/Alacant', 'alicante', 'alacant'],
  ['Almería', 'almeria'],
  ['Ávila', 'avila'],
  ['Badajoz', 'badajoz'],
  ['Balears, Illes', 'illes balears', 'islas baleares', 'baleares', 'illes', 'pmi', 'mallorca'],
  ['Barcelona', 'barcelona', 'badalona ciudad metropolitana'],
  ['Burgos', 'burgos'],
  ['Cáceres', 'caceres'],
  ['Cádiz', 'cadiz'],
  ['Cantabria', 'cantabria', 'santander ciudad'],
  ['Castellón/Castelló', 'castellon', 'castello'],
  ['Ciudad Real', 'ciudad real'],
  ['Córdoba', 'cordoba'],
  ['Cuenca', 'cuenca'],
  ['Girona', 'gerona', 'girona'],
  ['Granada', 'granada'],
  ['Guadalajara', 'guadalajara'],
  ['Gipuzkoa', 'guipuzcoa', 'gipuzkoa'],
  ['Huelva', 'huelva'],
  ['Huesca', 'huesca'],
  ['Jaén', 'jaen'],
  ['La Rioja', 'la rioja', 'logroño provincia'],
  ['Las Palmas', 'las palmas', 'laspalmas'],
  ['León', 'leon'],
  ['Lleida', 'lleida', 'lerida'],
  ['Lugo', 'lugo'],
  ['Madrid', 'madrid comunidad'],
  ['Málaga', 'malaga'],
  ['Murcia', 'murcia region'],
  ['Navarra', 'navarra', 'pamplona iparraldea'],
  ['Ourense', 'orense', 'ourense'],
  ['Palencia', 'palencia'],
  ['Pontevedra', 'pontevedra'],
  ['Salamanca', 'salamanca'],
  ['Santa Cruz de Tenerife', 'tenerife santa cruz', 'santa cruz tenerife'],
  ['Segovia', 'segovia'],
  ['Sevilla', 'sevilla'],
  ['Soria', 'soria'],
  ['Tarragona', 'tarragona'],
  ['Teruel', 'teruel'],
  ['Toledo', 'toledo'],
  ['Valencia/València', 'valencia provincia'],
  ['Valladolid', 'valladolid'],
  ['Bizkaia', 'vizcaya', 'bizkaia'],
  ['Zamora', 'zamora'],
  ['Zaragoza', 'zaragoza', 'saragossa'],
  ['Asturias', 'principado de asturias', 'asturias'],
  ['Ceuta', 'ceuta'],
  ['Melilla', 'melilla'],
];

/** squash →-canónico */
function buildAliasMap() {
  const m = Object.create(null);
  for (const [canonical, ...aliases] of PROVINCE_GROUPS) {
    m[squash(canonical)] = canonical;
    for (const a of aliases) {
      const k = squash(a);
      if (k && !m[k]) m[k] = canonical;
    }
  }
  return m;
}

const ALIAS = buildAliasMap();

function ocrCorunaHeuristic(sq) {
  // "coru a", "a coru", "coru n a", espacios raros por OCR
  const collapsed = sq.replace(/\s+/g, '');
  if (/^acoru(na|ña|n|a)?$/.test(collapsed)) return 'A Coruña';
  if (/^coru\s*a$/.test(sq)) return 'A Coruña';
  if (/^a\s+coru/.test(sq)) return 'A Coruña';
  if (/^coruna$/.test(sq) || /^coruña$/.test(sq)) return 'A Coruña';
  if (/coru\s*n\s*a/.test(collapsed.replace(/\s/g, ''))) return 'A Coruña';
  // fragmentos típicos: "CORU" + algo
  if (/^coru$/.test(sq) || /^coru\s/.test(sq)) return 'A Coruña';
  return null;
}

/**
 * Si el texto describe una provincia conocida (o OCR roto típico), devuelve el nombre canónico.
 * Si no coincide, devuelve el texto original recortado.
 */
export function canonicalProvince(raw) {
  if (raw == null) return '';
  const trimmed = String(raw).trim();
  if (!trimmed) return '';

  const sq = squash(trimmed);
  if (ALIAS[sq]) return ALIAS[sq];

  const ocr = ocrCorunaHeuristic(sq);
  if (ocr) return ocr;

  // Una sola palabra que sea subcadena conocida muy corta: evitar falsos positivos
  const firstTok = sq.split(' ')[0];
  if (firstTok === 'coruna' || firstTok === 'coruña') return 'A Coruña';

  return trimmed;
}
