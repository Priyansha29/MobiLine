import { Move } from 'lucide-react'

import { StatusPill } from '@/components/ui/StatusPill'
import { NO_VALUE } from '@/lib/format'
import type { Reading } from '@/types/reading'

interface MovementPanelProps {
  current: Reading | null
}

/**
 * Motion state from the MPU6500. The wording deliberately says "movement
 * detected" rather than a confirmed patient movement event: the prototype
 * cannot distinguish the two.
 */
export function MovementPanel({ current }: MovementPanelProps) {
  const movement = current?.movement ?? null
  const acceleration = current?.acceleration ?? null
  const missing = movement === null
  const tone = missing ? 'offline' : movement ? 'warning' : 'normal'
  const stateWord = missing ? 'No data' : movement ? 'Movement detected' : 'Stable'

  const deviation = acceleration === null ? null : Math.abs(acceleration - 1)
  const deviationPct = deviation === null ? null : Math.min(100, (deviation / 0.5) * 100)
  const barColor = movement ? '#ff9100' : '#4bb8af'

  return (
    <section className="panel flex flex-col p-5" aria-label="Structure movement">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-ink-600 text-[12.5px] leading-tight font-bold tracking-[0.1em] uppercase">
            Structure Movement
          </h3>
          <p className="text-ink-400 mt-0.5 text-[11px] leading-tight">
            MPU6500 motion flag
          </p>
        </div>
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
            missing ? 'bg-ink-100 text-ink-400' : 'bg-brand-50 text-brand-500'
          }`}
        >
          <Move size={19} strokeWidth={2.2} aria-hidden="true" />
        </span>
      </div>

      <p
        className={`mt-3 text-[clamp(1.35rem,1.5vw,1.9rem)] leading-none font-extrabold tracking-[-0.02em] uppercase ${
          missing ? 'text-ink-400' : movement ? 'text-warn-700' : 'text-safe-700'
        }`}
      >
        {missing ? NO_VALUE : movement ? 'Movement detected' : 'Stable'}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <StatusPill tone={tone} label={stateWord} />
        <p className="text-ink-600 text-[12.5px] leading-snug">
          {missing
            ? 'No motion flag received from the MPU6500.'
            : movement
              ? 'Motion detected — not a confirmed patient movement event.'
              : 'No motion detected by the MPU6500.'}
        </p>
      </div>

      <div className="mt-3.5">
        <div className="relative h-4 w-full overflow-hidden rounded-full bg-ink-100">
          <div aria-hidden="true" className="absolute inset-y-0 left-0 bg-safe-100" style={{ width: '20%' }} />
          {deviationPct !== null && (
            <div
              aria-hidden="true"
              className="absolute -inset-y-1 w-2 rounded-full shadow-[0_0_0_2px_#ffffff]"
              style={{ left: `calc(${deviationPct}% - 4px)`, backgroundColor: barColor }}
            />
          )}
        </div>
        <div className="text-ink-500 mt-1.5 flex items-center justify-between text-[11.5px] font-semibold tnum">
          <span>0 g deviation</span>
          <span>
            {acceleration === null ? 'Module acceleration —' : `Module acceleration ${acceleration.toFixed(3)} g`}
          </span>
          <span>0.5 g</span>
        </div>
      </div>

      <div className="text-ink-400 mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-3 text-[11.5px] tnum">
        <span>X {current?.accelX?.toFixed(3) ?? NO_VALUE}</span>
        <span>Y {current?.accelY?.toFixed(3) ?? NO_VALUE}</span>
        <span>Z {current?.accelZ?.toFixed(3) ?? NO_VALUE}</span>
        <span className="text-ink-500 font-semibold">g</span>
      </div>
    </section>
  )
}