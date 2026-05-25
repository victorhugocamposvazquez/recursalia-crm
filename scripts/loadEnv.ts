/**
 * Carga las variables de entorno desde `.env.local` (y opcionalmente `.env`)
 * en `process.env` sin depender de paquetes externos. Llamar SIEMPRE como
 * primer import en cualquier script CLI:
 *
 *   import './loadEnv';
 *
 * No sobrescribe variables que ya estén definidas en el entorno real.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function parseLine(line: string): { key: string; value: string } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx < 0) return null;
  const key = trimmed.slice(0, eqIdx).trim();
  let value = trimmed.slice(eqIdx + 1).trim();
  // Quita comillas envolventes (" o ').
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return { key, value };
}

function loadFile(path: string): void {
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  for (const rawLine of content.split('\n')) {
    const parsed = parseLine(rawLine);
    if (!parsed) continue;
    if (process.env[parsed.key] === undefined) {
      process.env[parsed.key] = parsed.value;
    }
  }
}

// .env.local tiene prioridad sobre .env (estilo Next.js).
loadFile(resolve(process.cwd(), '.env.local'));
loadFile(resolve(process.cwd(), '.env'));
