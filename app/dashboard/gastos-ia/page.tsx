'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from '../operations/operations.module.css';
import local from './gastos-ia.module.css';

interface RecentRow {
  id: string;
  created_at: string;
  provider: string;
  operation: string;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  image_requests: number;
  estimated_cost_usd: number;
  course_id: string | null;
}

interface AiUsagePayload {
  period: { from: string; days: number };
  totals: {
    estimated_cost_usd: number;
    events: number;
    by_provider: Record<string, number>;
  };
  by_operation: Array<{ operation: string; count: number; usd: number }>;
  recent: RecentRow[];
}

const DAY_OPTIONS = [30, 60, 90, 365] as const;

function fmtUsd(n: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n);
}

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function GastosIaPage() {
  const [days, setDays] = useState<number>(60);
  const [data, setData] = useState<AiUsagePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/dashboard/ai-usage?days=${encodeURIComponent(String(days))}`
        );
        const js = await res.json();
        if (!res.ok) throw new Error(js.details ?? js.error ?? 'Error');
        if (!cancel) setData(js as AiUsagePayload);
      } catch (e) {
        if (!cancel)
          setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancel = true;
    };
  }, [days]);

  const providerLines = useMemo(() => {
    const m = data?.totals.by_provider ?? {};
    return Object.entries(m).sort(([, a], [, b]) => b - a);
  }, [data]);

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{error}</p>
        <p className={styles.muted}>
          Si acabas de desplegar la migración <code className={local.code}>006_ai_usage_log</code>,
          ejecuta <code className={local.code}>supabase db push</code> o la migración en el proyecto remoto.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Gastos IA (estimado)</h1>
      <p className={styles.sub}>
        Resumen orientativo del consumo registrado desde esta app (OpenAI y Gemini).
        Los importes son <strong>estimaciones internas</strong> según tarifas aproximadas;
        no equivalen al detalle ni al importe oficial de tus facturas de OpenAI ni Google Cloud.
      </p>

      <div className={local.toolbar}>
        <label className={local.daysLabel}>
          Periodo:&nbsp;
          <select
            className={local.select}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {DAY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                Últimos {d} días
              </option>
            ))}
          </select>
        </label>
      </div>

      {!data ? (
        <p className={styles.muted}>Cargando…</p>
      ) : (
        <>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Coste estimado (periodo)</span>
              <strong>{fmtUsd(data.totals.estimated_cost_usd)}</strong>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Eventos registrados</span>
              <strong>{data.totals.events}</strong>
            </div>
            {providerLines.map(([p, usd]) => (
              <div key={p} className={styles.stat}>
                <span className={styles.statLabel}>{p}</span>
                <strong>{fmtUsd(usd)}</strong>
              </div>
            ))}
          </div>

          <h2 className={styles.sectionTitle}>Por operación</h2>
          {data.by_operation.length === 0 ? (
            <p className={styles.muted}>
              Aún no hay registros en el periodo. Los nuevos usos de IA quedarán listados aquí.
            </p>
          ) : (
            <div className={local.tableWrap}>
              <table className={local.table}>
                <thead>
                  <tr>
                    <th>Operación</th>
                    <th className={local.num}>Llamadas</th>
                    <th className={local.num}>USD est.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_operation.map((row) => (
                    <tr key={row.operation}>
                      <td>{row.operation}</td>
                      <td className={local.num}>{row.count}</td>
                      <td className={local.num}>{fmtUsd(row.usd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2 className={styles.sectionTitle}>Actividad reciente</h2>
          {data.recent.length === 0 ? (
            <p className={styles.muted}>Sin filas recientes.</p>
          ) : (
            <div className={local.tableWrap}>
              <table className={local.table}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Proveedor</th>
                    <th>Operación</th>
                    <th>Modelo</th>
                    <th className={local.num}>Tokens in/out</th>
                    <th className={local.num}>Imágenes</th>
                    <th className={local.num}>USD est.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((r) => (
                    <tr key={r.id}>
                      <td>{fmtDate(r.created_at)}</td>
                      <td>{r.provider}</td>
                      <td>{r.operation}</td>
                      <td className={local.mono}>{r.model}</td>
                      <td className={local.num}>
                        {r.input_tokens ?? '—'} / {r.output_tokens ?? '—'}
                      </td>
                      <td className={local.num}>{r.image_requests}</td>
                      <td className={local.num}>{fmtUsd(r.estimated_cost_usd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className={local.footnote}>
            Imágenes Gemini: el coste por imagen se puede ajustar con la variable de entorno{' '}
            <code className={local.code}>AI_GEMINI_IMAGE_USD_ESTIMATE</code> (por defecto 0,04 USD).
          </p>
        </>
      )}
    </div>
  );
}
