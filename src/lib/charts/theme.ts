/** Shared chart chrome so every plot feels like part of the same device. */

export const CHART = {
  grid: '#dce6ef',
  axis: '#5e7185',
  label: '#33475e',
  brand: '#2c5ead',
  bright: '#1591dc',
  cyan: '#00b7cd',
  safe: '#4bb8af',
  warn: '#ff9100',
  crit: '#df301c',
  zoneSafe: 'rgba(75, 184, 175, 0.07)',
  zoneWarn: 'rgba(255, 145, 0, 0.1)',
  zoneCrit: 'rgba(223, 48, 28, 0.09)',
} as const

export const axisTick = {
  fill: CHART.axis,
  fontSize: 13,
} as const

/** "10:42:18" — full clock for tooltips. */
export function fullTime(value: number): string {
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** "10:42" — compact axis tick. */
export function shortTime(value: number): string {
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Evenly spaced tick positions for a numeric time axis. */
export function timeTicks(from: number, to: number, count = 4): number[] {
  const step = (to - from) / count
  return Array.from({ length: count + 1 }, (_, i) => Math.round(from + step * i))
}