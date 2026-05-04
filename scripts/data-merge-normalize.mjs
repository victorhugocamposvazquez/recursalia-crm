#!/usr/bin/env node
/**
 * Une CSV con las mismas columnas y/o añade columna de provincia normalizada.
 *
 * Ejemplos:
 *   node scripts/data-merge-normalize.mjs merge --out unidos.csv a.csv b.csv
 *   node scripts/data-merge-normalize.mjs normalize --column orig_localidad --in entrada.csv --out salida.csv
 *
 * Opciones normalize:
 *   --column NOMBRE         columna de texto con provincias (u OCR roto tipo CORU A)
 *   --out-column NOMBRE     escribe el nombre canónico en esa columna (la crea al final si no existe)
 *   Por defecto: añade columna "<column>_provincia_canonica"
 */

import fs from 'node:fs';
import path from 'node:path';

import { parseCsv, rowsToCsv } from './lib/csv-io.mjs';
import { canonicalProvince } from './lib/spain-province-normalize.mjs';

function readUtf8(p) {
  return fs.readFileSync(path.resolve(p), 'utf8');
}

function usage() {
  console.error(`
Uso:
  merge --out <archivo.csv> <uno_o_más.csv>
    Une filas manteniendo la cabecera del primer archivo (el resto debe tener las mismas columnas).

  normalize --column <col> [--out-column <col2>] [--replace] [--in <f.csv>] [--out <g.csv>]
    Provincia canónica: por defecto añade *_provincia_canonica;
    --out-column nombre / --replace sobrescribe o fija una columna concreta.
    Sin --in/--out puede usarse entrada por stdin.

Ejemplos: "CORU A", "A CORU", "Coruña", "LA CORUNA" → "A Coruña"
`);
  process.exit(1);
}

function cmdMerge(argv) {
  const outIdx = argv.indexOf('--out');
  if (outIdx < 0 || !argv[outIdx + 1]) usage();
  const outPath = argv[outIdx + 1];
  const inputs = argv.filter((_, i) => !(i >= outIdx && i <= outIdx + 1));
  const files = inputs.filter((x) => !x.startsWith('--'));
  if (files.length < 1) usage();

  let header = null;
  const allRows = [];
  for (const f of files) {
    const text = readUtf8(f);
    const rows = parseCsv(text.replace(/^\ufeff/, ''));
    if (rows.length < 1) continue;
    const [h, ...data] = rows;
    const hNorm = h.map((c) => c.trim());
    if (!header) {
      header = hNorm;
    } else if (hNorm.join('\x1e') !== header.join('\x1e')) {
      console.error(`Cabeceras distintas: ${files[0]} vs ${f}`);
      process.exit(2);
    }
    allRows.push(...data.filter((r) => r.some((c) => String(c ?? '').trim() !== '')));
  }
  fs.writeFileSync(path.resolve(outPath), rowsToCsv([header, ...allRows]), 'utf8');
  console.error(`Escrito ${allRows.length} filas (+ cabecera) → ${outPath}`);
}

function cmdNormalize(argv) {
  const colIdx = argv.indexOf('--column');
  if (colIdx < 0 || !argv[colIdx + 1]) usage();
  const colName = argv[colIdx + 1];

  let outCol = null;
  const oc = argv.indexOf('--out-column');
  if (oc >= 0 && argv[oc + 1]) outCol = argv[oc + 1];

  const replace = argv.includes('--replace');

  let inPath = null;
  const ii = argv.indexOf('--in');
  if (ii >= 0 && argv[ii + 1]) inPath = argv[ii + 1];

  let outPath = null;
  const oo = argv.indexOf('--out');
  if (oo >= 0 && argv[oo + 1]) outPath = argv[oo + 1];

  const raw = inPath ? readUtf8(inPath).replace(/^\ufeff/, '') : fs.readFileSync(0, 'utf8');
  const rows = parseCsv(raw);
  if (rows.length < 2) {
    console.error('CSV vacío o sin datos');
    process.exit(3);
  }
  const header = rows[0].map((c) => c.trim());
  const hc = header.indexOf(colName);
  if (hc < 0) {
    console.error(`No existe columna "${colName}". Cabeceras: ${header.join(', ')}`);
    process.exit(4);
  }

  /** @type {string[]} */
  let th = [...header];
  /** @type {number} */
  let canonIdx;

  if (replace && !outCol) {
    canonIdx = hc;
  } else if (outCol) {
    canonIdx = th.indexOf(outCol);
    if (canonIdx < 0) {
      th.push(outCol);
      canonIdx = th.length - 1;
    }
  } else {
    const appended = `${colName}_provincia_canonica`;
    th = [...header, appended];
    canonIdx = th.length - 1;
  }

  const dataRows = [];
  for (let r = 1; r < rows.length; r++) {
    const row = [...rows[r]];
    while (row.length < header.length) row.push('');
    const canon = canonicalProvince(row[hc]);
    if (canonIdx >= row.length) {
      while (row.length <= canonIdx) row.push('');
    }
    row[canonIdx] = canon;
    dataRows.push(row);
  }

  const normalized = dataRows.map((rr) => {
    const pad = [...rr];
    while (pad.length < th.length) pad.push('');
    return pad.slice(0, th.length);
  });

  const csv = rowsToCsv([th, ...normalized]);

  if (outPath) fs.writeFileSync(path.resolve(outPath), csv, 'utf8');
  else process.stdout.write(csv);
}

const argv = process.argv.slice(2);
if (argv.length < 2) usage();

const cmd = argv[0];
if (cmd === 'merge') cmdMerge(argv.slice(1));
else if (cmd === 'normalize') cmdNormalize(argv.slice(1));
else usage();
