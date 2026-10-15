import { clamp } from '@/lib/format'
import { TONES, toneForLevel } from '@/lib/statusVisuals'
import type { ReadingLevel } from '@/types/reading'

interface AngleGaugeProps {
  /** Signed tilt in degrees; null when no reading is available. */
  value: number | null
  level: ReadingLevel
  /** Range shown each side of 0°, e.g. 90. */
  range?: number
}

/**
 * Semicircular tilt indicator for the MPU6500-derived angle. The needle only
 * appears when a real reading exists.
 */
export function AngleGauge({ value, level, range = 90 }: AngleGaugeProps) {
  const tone = toneForLevel(level)
  const color = value === null ? '#c2d2e2' : TONES[tone].accent
  const clamped = value === null ? 0 : clamp(value, -range, range)

  return (
    <svg viewBox="0 0 200 118" className="h-auto w-full" aria-hidden="true">
      {/* Track */}
      <path
        d="M16 106 A84 84 0 0 1 184 106"
        fill="none"
        stroke="#dce6ef"
        strokeWidth={10}
        strokeLinecap="round"
      />
      {/* Centre reference */}
      <line x1="100" y1="106" x2="100" y2="26" stroke="#e5eef6" strokeWidth={2} strokeDasharray="4 4" />
      {value !== null && (
        <line
          x1="100"
          y1="106"
          x2="100"
          y2="34"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          transform={`rotate(${clamped} 100 106)`}
        />
      )}
      <circle cx="100" cy="106" r="7" fill="#ffffff" stroke="#dce6ef" strokeWidth={2} />
      <text x="14" y="116" fontSize="12" fontWeight="600" fill="#5e7185">
        −{range}°
      </text>
      <text x="186" y="116" fontSize="12" fontWeight="600" fill="#5e7185" textAnchor="end">
        +{range}°
      </text>
      <text x="100" y="116" fontSize="12" fontWeight="600" fill="#5e7185" textAnchor="middle">
        0°
      </text>
    </svg>
  )
}