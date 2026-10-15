import { Radio } from 'lucide-react'

import { StatusDot } from '@/components/ui/StatusPill'
import { formatAgo, formatClock, NO_VALUE } from '@/lib/format'
import { THRESHOLDS } from '@/lib/thresholds'
import { TONES, type Tone } from '@/lib/statusVisuals'
import type { LinkInfo, Reading } from '@/types/reading'

interface DeviceLinkPanelProps {
  link: LinkInfo
  current: Reading | null
  nowMs: number
}

function stateWord(link: LinkInfo): { tone: Tone; word: string } {
  switch (link.state) {
    case 'live':
      return { tone: 'normal', word: 'Live' }
    case 'stale':
      return { tone: 'stale', word: 'Data stale' }
    case 'disconnected':
      return { tone: 'critical', word: 'Disconnected' }
    case 'connecting':
      return { tone: 'info', word: 'Connecting' }
    default:
      return { tone: 'offline', word: 'Not configured' }
  }
}

function Item({
  label,
  value,
  toned,
}: {
  label: string
  value: string
  toned?: string
}) {
  return (
    <div className="flex min-w-0 items-baseline gap-1.5">
      <span className="text-ink-500 shrink-0 text-[10.5px] font-bold tracking-[0.08em] uppercase">
        {label}
      </span>
      <span className={`tnum min-w-0 truncate text-[12.5px] font-semibold ${toned ?? 'text-ink-800'}`}>
        {value}
      </span>
    </div>
  )
}

/**
 * Compact diagnostic strip: live HTTP link figures plus the active prototype
 * thresholds, kept out of the main clinical hierarchy.
 */
export function DeviceLinkPanel({ link, current, nowMs }: DeviceLinkPanelProps) {
  const state = stateWord(link)
  const tone = TONES[state.tone]

  return (
    <section
      className="panel flex flex-wrap items-center gap-x-6 gap-y-1.5 px-4 py-2"
      aria-label="Monitoring link, prototype thresholds and device diagnostics"
    >
      <div className="flex items-center gap-2">
        <Radio size={15} strokeWidth={2.2} className="text-brand-500" aria-hidden="true" />
        <span className="text-ink-800 text-[12px] font-bold tracking-[0.06em] uppercase">
          Monitoring link
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-bold ${tone.softBg} ${tone.border} ${tone.textStrong}`}
        >
          <StatusDot tone={state.tone} pulse={link.state === 'live'} size={8} />
          {state.word}
        </span>
      </div>

      <Item label="Endpoint" value={link.endpoint || 'Not configured'} />
      <Item
        label="Last sample"
        value={
          link.lastSuccessAt
            ? `${formatClock(link.lastSuccessAt)} · ${formatAgo(link.lastSuccessAt, nowMs)}`
            : 'None received'
        }
      />
      <Item label="Samples" value={link.packetsReceived.toLocaleString()} />
      <Item label="Round-trip" value={link.latencyMs === null ? NO_VALUE : `${link.latencyMs} ms`} />
      <Item
        label="Device uptime"
        value={
          current?.deviceUptimeMs == null ? NO_VALUE : `${(current.deviceUptimeMs / 1000).toFixed(1)} s`
        }
      />
      <Item
        label="Device status"
        value={current?.deviceStatus ?? NO_VALUE}
        toned={
          current?.deviceStatus === 'CRITICAL'
            ? 'text-crit-700'
            : current?.deviceStatus === 'WARNING'
              ? 'text-warn-700'
              : undefined
        }
      />

      <div className="flex items-center gap-1.5">
        <span className="text-ink-500 text-[10.5px] font-bold tracking-[0.08em] uppercase">
          Prototype limits
        </span>
        <span className="text-ink-600 text-[12px] font-semibold tnum">
          Tension <span className="text-warn-700">{THRESHOLDS.tensionWarningN.toFixed(2)}</span>/
          <span className="text-crit-700">{THRESHOLDS.tensionCriticalN.toFixed(2)} N</span>
          <span className="text-ink-400"> (warning/critical)</span>
        </span>
      </div>

      {link.lastError && (
        <p className="text-crit-700 text-[12px] font-semibold">Last error: {link.lastError}</p>
      )}
    </section>
  )
}