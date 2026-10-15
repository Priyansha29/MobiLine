import { Compass } from 'lucide-react'

import { MeasurementPanel } from '@/components/MeasurementPanel'
import { AngleGauge } from '@/components/ui/AngleGauge'
import { tiltLevel } from '@/lib/status'
import { THRESHOLDS } from '@/lib/thresholds'
import type { Reading, ReadingLevel } from '@/types/reading'

const STATE_WORDS: Record<ReadingLevel, string> = {
  normal: 'Level',
  attention: 'Tilted',
  critical: 'Tilted',
  unknown: 'No data',
}

const NOTES: Record<ReadingLevel, string> = {
  normal: 'Sensor tilt is close to level.',
  attention: `Tilt above ${THRESHOLDS.tiltElevatedDeg}° recorded by the IMU.`,
  critical: `Tilt above ${THRESHOLDS.tiltElevatedDeg}° recorded by the IMU.`,
  unknown: 'No angle reading received from the MPU6500.',
}

export function TiltPanel({ current }: { current: Reading | null }) {
  const value = current?.tiltAngle ?? null
  const level = tiltLevel(value)

  return (
    <MeasurementPanel
      label="Structure Angle"
      sublabel="MPU6500 tilt · degrees"
      icon={Compass}
      value={value === null ? '' : value.toFixed(1)}
      unit="°"
      level={level}
      stateWord={STATE_WORDS[level]}
      note={NOTES[level]}
      ariaLabel={`Structure angle ${value === null ? 'unavailable' : `${value.toFixed(1)} degrees`}`}
      footer={<span>Sensor tilt only — label depends on the confirmed MPU6500 mounting point.</span>}
    >
      <AngleGauge value={value} level={level} />
    </MeasurementPanel>
  )
}