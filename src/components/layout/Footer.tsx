import { FlaskConical } from 'lucide-react'

/**
 * Subtle, non-interactive footer. Carries the academic-prototype disclaimer so
 * the screen is never mistaken for a validated medical device.
 */
export function Footer() {
  return (
    <footer className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-ink-200 bg-white px-4 py-2.5 text-center">
      <p className="text-ink-600 flex items-center gap-2 text-[12.5px] font-medium">
        <FlaskConical size={14} className="text-warn-600 shrink-0" aria-hidden="true" />
        Academic prototype • Sensor readings and alert thresholds require calibration and clinical
        validation.
      </p>
      <p className="text-ink-400 text-[12px]">
        Not a medical device • Do not use for diagnosis or treatment decisions
      </p>
    </footer>
  )
}