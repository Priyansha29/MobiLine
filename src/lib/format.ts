/** Small shared formatting helpers so units and rounding stay consistent. */

export const formatTension = (value: number) => `${value.toFixed(2)} N`
export const formatAngle = (value: number) => `${value.toFixed(1)}°`
export const formatDrip = (value: number) => `${Math.round(value)}`

/** Placeholder for a genuinely missing reading. Never a fake zero. */
export const NO_VALUE = '—'

/** "10:42:18" */
export function formatClock(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** "10:42:18 AM" — used in the header. */
export function formatClock12(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date
  const pad = (n: number) => String(n).padStart(2, '0')
  const hours = d.getHours() % 12 || 12
  const suffix = d.getHours() >= 12 ? 'PM' : 'AM'
  return `${hours}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${suffix}`
}

/** "3m 12s" style uptime. */
export function formatUptime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

/** "2 s ago" / "just now" */
export function formatAgo(fromMs: number, nowMs: number): string {
  const delta = Math.max(0, (nowMs - fromMs) / 1000)
  if (delta < 1.5) return 'just now'
  if (delta < 60) return `${delta.toFixed(1)} s ago`
  const m = Math.floor(delta / 60)
  return `${m} min ago`
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))
