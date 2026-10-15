import { formatAgo, formatClock12 } from '@/lib/format'
import { TONES, type Tone } from '@/lib/statusVisuals'
import { StatusDot } from '@/components/ui/StatusPill'
import type { LinkInfo, Reading } from '@/types/reading'
import { BrandMark } from './BrandMark'

interface HeaderProps {
  link: LinkInfo
  current: Reading | null
  nowMs: number
}

function linkPresentation(link: LinkInfo): { tone: Tone; label: string; detail: string } {
  switch (link.state) {
    case 'live':
      return {
        tone: 'normal',
        label: 'ESP32 CONNECTED',
        detail: 'Receiving live sensor data',
      }
    case 'stale':
      return {
        tone: 'stale',
        label: 'ESP32 — DATA STALE',
        detail: 'No recent updates from the device',
      }
    case 'disconnected':
      return {
        tone: 'critical',
        label: 'ESP32 DISCONNECTED',
        detail: 'Device is not responding',
      }
    case 'connecting':
      return {
        tone: 'info',
        label: 'ESP32 — CONNECTING',
        detail: 'Contacting the device endpoint',
      }
    default:
      return {
        tone: 'offline',
        label: 'ESP32 — NOT CONFIGURED',
        detail: 'Set the hardware endpoint to begin monitoring',
      }
  }
}

/**
 * System header — identity, hardware link state and the timestamp of the last
 * successful sample. Reflects real communication; never a permanently green
 * badge.
 */
export function Header({ link, current, nowMs }: HeaderProps) {
  const presentation = linkPresentation(link)
  const tone = TONES[presentation.tone]

  const lastUpdate = link.lastSuccessAt
    ? `Last update ${formatClock12(link.lastSuccessAt)} · ${formatAgo(link.lastSuccessAt, nowMs)}`
    : 'No data received yet'

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-ink-200 bg-white px-6 py-3">
      <div className="flex min-w-0 items-center gap-3.5">
        <BrandMark size={46} />
        <div className="min-w-0">
          <div className="flex items-baseline gap-2.5">
            <h1 className="text-ink-900 text-[30px] leading-none font-extrabold tracking-[-0.02em]">
              IVGuard
            </h1>
            <span className="text-ink-500 text-[12px] font-semibold tracking-[0.14em] uppercase">
              Prototype
            </span>
          </div>
          <p className="text-ink-500 mt-1 truncate text-[14px] leading-tight">
            Movement-Aware IV Tubing Safety &amp; Monitoring System
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="text-right">
          <p className="text-ink-500 text-[11.5px] font-semibold tracking-[0.1em] uppercase">
            Last successful update
          </p>
          <p className="tnum text-ink-800 text-[14px] font-semibold">{lastUpdate}</p>
        </div>

        <div className="block h-10 w-px bg-ink-200" />

        <div
          className={`flex items-center gap-3 rounded-xl border px-3.5 py-2 ${tone.softBg} ${tone.border}`}
          role="status"
          aria-live="polite"
        >
          <StatusDot tone={presentation.tone} pulse={link.state === 'live'} size={11} />
          <div className="leading-tight">
            <p className={`text-[14px] font-extrabold tracking-[0.03em] ${tone.textStrong}`}>
              {presentation.label}
            </p>
            <p className="text-ink-500 text-[11.5px]">
              {current && current.deviceUptimeMs !== null
                ? `${presentation.detail} · device uptime ${(current.deviceUptimeMs / 1000).toFixed(1)} s`
                : presentation.detail}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}