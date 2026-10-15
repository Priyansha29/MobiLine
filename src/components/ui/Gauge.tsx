import { clamp } from '@/lib/format'
import { TONES, toneForLevel } from '@/lib/statusVisuals'
import type { ReadingLevel } from '@/types/reading'

interface GaugeProps {
  value: number | null
  max: number
  /** Value at which the prototype warning zone begins. */
  warningAt: number
  /** Value at which the prototype critical zone begins. */
  criticalAt: number
  level: ReadingLevel
  /** Format for the scale labels. */
  format: (value: number) => string
  ariaLabel: string
}

/**
 * Horizontal range gauge with the prototype warning / critical zones marked.
 * A missing reading leaves the track empty — it is never plotted as zero.
 */
export function Gauge({
  value,
  max,
  warningAt,
  criticalAt,
  level,
  format,
  ariaLabel,
}: GaugeProps) {
  const pct = (v: number) => clamp((v / max) * 100, 0, 100)
  const warningPct = pct(warningAt)
  const criticalPct = pct(criticalAt)
  const tone = toneForLevel(level)
  const markerColor = TONES[tone].accent
  const markerPct = value === null ? null : pct(value)

  return (
    <div aria-label={ariaLabel} role="img">
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 bg-safe-100"
          style={{ width: `${warningPct}%` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 bg-warn-100"
          style={{ left: `${warningPct}%`, width: `${Math.max(0, criticalPct - warningPct)}%` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 bg-crit-100"
          style={{ width: `${Math.max(0, 100 - criticalPct)}%` }}
        />
        {markerPct !== null && (
          <div
            aria-hidden="true"
            className="absolute -inset-y-1 w-2 rounded-full shadow-[0_0_0_2px_#ffffff]"
            style={{ left: `calc(${markerPct}% - 4px)`, backgroundColor: markerColor }}
          />
        )}
      </div>

      <div className="text-ink-500 relative mt-1.5 h-4 text-[11.5px] font-semibold tnum">
        <span className="absolute left-0">0</span>
        <span
          className="absolute -translate-x-1/2 text-warn-700"
          style={{ left: `${warningPct}%` }}
        >
          {format(warningAt)}
        </span>
        <span
          className="absolute -translate-x-1/2 text-crit-700"
          style={{ left: `${criticalPct}%` }}
        >
          {format(criticalAt)}
        </span>
        <span className="absolute right-0">{format(max)}</span>
      </div>
    </div>
  )
}