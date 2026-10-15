/**
 * Runtime configuration
 * ---------------------
 * The dashboard talks to the ESP32 prototype over Wi-Fi by polling its HTTP
 * `/data` endpoint. The base URL is resolved at runtime in this order:
 *
 *   1. `window.IVGUARD_API_BASE`  — lets an installed kiosk build be pointed at
 *      a device without rebuilding (see README).
 *   2. `import.meta.env.VITE_API_BASE` — Vite build-time environment variable.
 *
 * If neither is set the dashboard reports "NOT CONFIGURED" and never falls back
 * to fabricated data.
 */

declare global {
  interface Window {
    /** Optional runtime override, set from `public/config.js` or the console. */
    IVGUARD_API_BASE?: string
  }
}

/** Accepts `http://host`, `http://host/` or a full `http://host/data` URL. */
export function resolveDataUrl(base: string): string {
  const trimmed = (base ?? '').trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  if (/\/data$/i.test(trimmed)) return trimmed
  return `${trimmed}/data`
}

const runtimeBase =
  typeof window !== 'undefined' &&
  typeof window.IVGUARD_API_BASE === 'string' &&
  window.IVGUARD_API_BASE.trim() !== ''
    ? window.IVGUARD_API_BASE
    : undefined

const envBase = import.meta.env.VITE_API_BASE as string | undefined

/** Raw configured base (without `/data` appended), for display. */
export const API_BASE = (runtimeBase ?? envBase ?? '').trim()

/** Full endpoint polled by the dashboard. Empty string ⇒ not configured. */
export const DATA_URL = resolveDataUrl(API_BASE)

export const CONFIG = {
  /** Poll every 750 ms — inside the 500–1000 ms range from the brief. */
  pollIntervalMs: 750,
  /** Abort a request that has not answered within 2.5 s. */
  requestTimeoutMs: 2500,
  /** No successful sample for this long ⇒ DATA STALE. */
  staleAfterMs: 3500,
  /** Consecutive failed requests before declaring the link lost. */
  failuresForOffline: 3,
  /** Rolling history window shown on the trend charts. */
  historyWindowMs: 120_000,
  /** Hard cap on retained samples (≈ 2.5 min at 750 ms). */
  historyLimit: 260,
  /** Most recent events kept on screen. */
  eventLimit: 40,
  /** Refresh cadence for "seconds ago" text and stale detection. */
  clockTickMs: 500,
} as const

export const isConfigured = DATA_URL.length > 0
