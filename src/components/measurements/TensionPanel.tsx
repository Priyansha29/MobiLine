import { Activity } from 'lucide-react'

import { MeasurementPanel } from '@/components/MeasurementPanel'
import { Gauge } from '@/components/ui/Gauge'
import { tensionLevel } from '@/lib/status'
import { THRESHOLDS } from '@/lib/thresholds'
import type { Reading, ReadingLevel } from '@/types/reading'

const STATE_WORDS: Record<ReadingLevel, string> = {
  normal: 'Within range',
  attention: 'Elevated',
  critical: 'Critical',
  unknown: 'No data',
}

const NOTES: Record<ReadingLevel, string> = {
  normal: 'Pulling force on the tubing is within range.',
  attention: 'Pulling force is above the prototype warning level.',
  critical: 'Pulling force is above the prototype critical level.',
  unknown: 'No tension reading received from the load cell.',
}

export function TensionPanel({ current }: { current: Reading | null }) {
  const value = current?.tension ?? null
  const level = tensionLevel(value)

  return (
    <MeasurementPanel
      label="Tubing Tension"
      sublabel="Load cell · newtons"
      icon={Activity}
      value={value === null ? '' : value.toFixed(2)}
      unit="N"
      level={level}
      stateWord={STATE_WORDS[level]}
      note={NOTES[level]}
      ariaLabel={`Tubing tension ${value === null ? 'unavailable' : `${value.toFixed(2)} newtons`}`}
      footer={
        <span className="tnum">
          Prototype limits {THRESHOLDS.tensionWarningN.toFixed(2)} N warning ·{' '}
          {THRESHOLDS.tensionCriticalN.toFixed(2)} N critical
        </span>
      }
    >
      <Gauge
        value={value}
        max={THRESHOLDS.tensionScaleMaxN}
        warningAt={THRESHOLDS.tensionWarningN}
        criticalAt={THRESHOLDS.tensionCriticalN}
        level={level}
        format={(v) => v.toFixed(2)}
        ariaLabel="Tension relative to prototype thresholds"
      />
    </MeasurementPanel>
  )
}