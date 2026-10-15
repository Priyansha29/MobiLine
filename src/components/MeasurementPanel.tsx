import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

import { StatusPill } from '@/components/ui/StatusPill'
import { NO_VALUE } from '@/lib/format'
import { toneForLevel } from '@/lib/statusVisuals'
import type { ReadingLevel } from '@/types/reading'

interface MeasurementPanelProps {
  label: string
  /** Optional clarification under the label (e.g. sensor caveats). */
  sublabel?: string
  icon: LucideIcon
  /** Formatted number without the unit. */
  value: string
  unit: string
  level: ReadingLevel
  /** Short state word, e.g. "Within range". */
  stateWord: string
  /** One short plain-language sentence. */
  note: string
  /** Optional visualization (gauge, sparkline, angle). */
  children?: ReactNode
  /** Optional small print at the bottom. */
  footer?: ReactNode
  ariaLabel?: string
}

/**
 * One live measurement. Big value + unit, an icon, a plain-language state and
 * a short note — the four things a reader needs, nothing else.
 */
export function MeasurementPanel({
  label,
  sublabel,
  icon: Icon,
  value,
  unit,
  level,
  stateWord,
  note,
  children,
  footer,
  ariaLabel,
}: MeasurementPanelProps) {
  const tone = toneForLevel(level)
  const missing = level === 'unknown'

  return (
    <section className="panel flex flex-col p-5" aria-label={ariaLabel ?? label}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-ink-600 text-[12.5px] leading-tight font-bold tracking-[0.1em] uppercase">
            {label}
          </h3>
          {sublabel && (
            <p className="text-ink-400 mt-0.5 text-[11px] leading-tight">{sublabel}</p>
          )}
        </div>
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
            missing ? 'bg-ink-100 text-ink-400' : 'bg-brand-50 text-brand-500'
          }`}
        >
          <Icon size={19} strokeWidth={2.2} aria-hidden="true" />
        </span>
      </div>

      <p className="mt-2.5 flex items-baseline gap-1.5">
        <span
          className={`tnum text-[clamp(2.2rem,3vw,3.75rem)] leading-none font-extrabold tracking-[-0.03em] ${
            missing ? 'text-ink-400' : 'text-ink-900'
          }`}
        >
          {missing ? NO_VALUE : value}
        </span>
        <span className={`text-[15px] font-bold ${missing ? 'text-ink-400' : 'text-ink-500'}`}>
          {unit}
        </span>
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <StatusPill tone={tone} label={stateWord} />
        <p className="text-ink-600 text-[12.5px] leading-snug">{note}</p>
      </div>

      {children && <div className="mt-3.5">{children}</div>}
      {footer && (
        <div className="text-ink-400 mt-auto flex items-center gap-2 pt-3 text-[11.5px]">
          {footer}
        </div>
      )}
    </section>
  )
}