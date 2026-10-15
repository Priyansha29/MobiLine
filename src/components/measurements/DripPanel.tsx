import { Droplets } from 'lucide-react'

import { MeasurementPanel } from '@/components/MeasurementPanel'
import { Sparkline } from '@/components/ui/Sparkline'
import type { DripAdvisory } from '@/lib/status'
import { CHART } from '@/lib/charts/theme'
import type { Reading } from '@/types/reading'

const STATE_WORDS: Record<DripAdvisory, string> = {
  none: 'Steady',
  low: 'Low',
  changed: 'Changed',
  'no-drops': 'No drops',
  unknown: 'No data',
}

const NOTES: Record<DripAdvisory, string> = {
  none: 'Drop activity is steady.',
  low: 'Fewer drops than the advisory range.',
  changed: 'Drop activity has changed from its recent baseline.',
  'no-drops': 'No drops detected — verify the drip sensor and the line.',
  unknown: 'No drop count received from the drip sensor.',
}

const TONES: Record<DripAdvisory, 'normal' | 'attention' | 'unknown'> = {
  none: 'normal',
  low: 'attention',
  changed: 'attention',
  'no-drops': 'attention',
  unknown: 'unknown',
}

interface DripPanelProps {
  current: Reading | null
  recent: Array<number | null>
  advisory: DripAdvisory
}

export function DripPanel({ current, recent, advisory }: DripPanelProps) {
  const value = current?.dripRate ?? null
  const level = TONES[advisory]
  const sparkColor = level === 'attention' ? CHART.warn : level === 'normal' ? CHART.safe : CHART.axis

  return (
    <MeasurementPanel
      label="Drip Rate"
      sublabel="Drip sensor · drops/min"
      icon={Droplets}
      value={value === null ? '' : Math.round(value).toString()}
      unit="drops/min"
      level={level}
      stateWord={STATE_WORDS[advisory]}
      note={NOTES[advisory]}
      ariaLabel={`Drip rate ${value === null ? 'unavailable' : `${Math.round(value)} drops per minute`}`}
      footer={<span>Drop count only — not calibrated to mL/hour.</span>}
    >
      <div className="rounded-lg border border-ink-100 bg-ink-50/60 px-2 py-1.5">
        <Sparkline values={recent} color={sparkColor} className="h-8 w-full" />
        <p className="text-ink-400 mt-0.5 text-[10.5px] font-semibold tracking-[0.08em] uppercase">
          Recent drop activity
        </p>
      </div>
    </MeasurementPanel>
  )
}