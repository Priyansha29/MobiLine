import { CONFIG } from '@/config'
import { clamp } from './format'
import type { DeviceStatus, LinkInfo, LinkState, Reading } from '@/types/reading'

/**
 * ESP32 HTTP client
 * -----------------
 * Polls the firmware's `/data` endpoint on a self-scheduling loop (the next
 * request is queued only after the previous one settles, so a slow device can
 * never pile up overlapping requests). Every response is normalised into a
 * `Reading`; unusable payloads raise an error instead of producing fake data.
 */

const DEVICE_STATUSES = new Set<DeviceStatus>(['NORMAL', 'WARNING', 'CRITICAL'])

/** Parse a numeric field. Returns null for missing/non-finite values. */
function num(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function bool(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

const READING_KEYS = [
  'timestamp',
  'tension',
  'tension_n',
  'bed_angle',
  'angle',
  'drip_rate',
  'drips',
  'movement',
] as const

/** Convert a raw `/data` payload to a Reading. Returns null if unusable. */
export function normalizeReading(raw: unknown, receivedAt: number): Reading | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const envelope = raw as Record<string, unknown>
  const body =
    'data' in envelope && typeof envelope.data === 'object' && envelope.data !== null
      ? (envelope.data as Record<string, unknown>)
      : envelope

  // Reject payloads that contain none of the expected telemetry fields. This
  // stops a stray HTML error page (valid JSON string/number) being treated as a
  // live sample.
  if (!READING_KEYS.some((key) => key in body)) return null

  const statusRaw = String(body.status ?? '').toUpperCase()
  const deviceStatus = DEVICE_STATUSES.has(statusRaw as DeviceStatus)
    ? (statusRaw as DeviceStatus)
    : null

  const uptime = num(body.timestamp)

  return {
    receivedAt,
    deviceUptimeMs: uptime !== null && uptime >= 0 ? uptime : null,
    tension: num(body.tension ?? body.tension_n),
    tiltAngle: num(body.bed_angle ?? body.angle),
    dripRate: num(body.drip_rate ?? body.drips),
    movement: bool(body.movement),
    acceleration: num(body.acceleration),
    accelX: num(body.accel_x),
    accelY: num(body.accel_y),
    accelZ: num(body.accel_z),
    deviceStatus,
  }
}

/** Compute the effective link state from raw counters and the current clock. */
export function deriveLinkState(
  link: Pick<LinkInfo, 'lastSuccessAt' | 'consecutiveFailures'>,
  configured: boolean,
  now: number,
): LinkState {
  if (!configured) return 'unconfigured'
  if (link.lastSuccessAt === null) {
    return link.consecutiveFailures >= CONFIG.failuresForOffline ? 'disconnected' : 'connecting'
  }
  if (now - link.lastSuccessAt > CONFIG.staleAfterMs) return 'stale'
  return 'live'
}

function describeError(err: unknown): string {
  if (err instanceof DOMException && err.name === 'AbortError') return 'Request timed out'
  if (err instanceof TypeError) return 'Network error — check Wi-Fi/hotspot and CORS'
  if (err instanceof Error && err.message) return err.message
  return 'Unknown error'
}

export interface DeviceClientOptions {
  url: string
  onReading: (reading: Reading) => void
  onLink: (link: LinkInfo) => void
  intervalMs?: number
  timeoutMs?: number
}

export function createDeviceClient({
  url,
  onReading,
  onLink,
  intervalMs = CONFIG.pollIntervalMs,
  timeoutMs = CONFIG.requestTimeoutMs,
}: DeviceClientOptions) {
  let stopped = false
  let timer: number | null = null
  let controller: AbortController | null = null

  let link: LinkInfo = {
    state: 'connecting',
    endpoint: url,
    lastSuccessAt: null,
    lastAttemptAt: null,
    lastError: null,
    consecutiveFailures: 0,
    packetsReceived: 0,
    latencyMs: null,
  }

  const emit = (patch: Partial<LinkInfo>) => {
    const next: LinkInfo = { ...link, ...patch }
    next.state = deriveLinkState(next, true, Date.now())
    link = next
    onLink(link)
  }

  const poll = async () => {
    if (stopped) return
    const started = performance.now()
    controller = new AbortController()
    const timeout = window.setTimeout(() => controller?.abort(), timeoutMs)

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        throw new Error('Malformed JSON')
      }
      const reading = normalizeReading(parsed, Date.now())
      if (!reading) throw new Error('Unexpected payload shape')

      emit({
        lastSuccessAt: reading.receivedAt,
        lastAttemptAt: reading.receivedAt,
        lastError: null,
        consecutiveFailures: 0,
        packetsReceived: link.packetsReceived + 1,
        latencyMs: Math.round(clamp(performance.now() - started, 0, 60_000)),
      })
      onReading(reading)
    } catch (err) {
      emit({
        lastAttemptAt: Date.now(),
        lastError: describeError(err),
        consecutiveFailures: link.consecutiveFailures + 1,
      })
    } finally {
      window.clearTimeout(timeout)
      controller = null
      if (!stopped) timer = window.setTimeout(poll, intervalMs)
    }
  }

  void poll()

  return {
    stop() {
      stopped = true
      if (timer !== null) window.clearTimeout(timer)
      controller?.abort()
    },
    getLink: () => link,
  }
}
