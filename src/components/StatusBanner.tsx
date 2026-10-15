import { ClipboardCheck, Move } from 'lucide-react'

import { TONES, toneForState, UNCONFIGURED_ICON } from '@/lib/statusVisuals'
import type { SafetyAssessment } from '@/types/reading'

interface StatusBannerProps {
  assessment: SafetyAssessment
}

/** Fixed sub-label shown under each state word (from the brief). */
const SUBLABELS: Record<SafetyAssessment['state'], string> = {
  NORMAL: 'All monitored parameters within configured prototype thresholds',
  WARNING: 'Attention required',
  CRITICAL: 'Immediate line inspection required',
  'CONNECTION LOST': 'Live readings unavailable',
  'DATA STALE': 'Live readings are not updating',
  'NOT CONFIGURED': 'Hardware endpoint needs configuration',
}

/**
 * Primary safety status — the most dominant element on the screen. Readable
 * from across the room and understood in two or three seconds.
 */
export function StatusBanner({ assessment }: StatusBannerProps) {
  const tone = toneForState(assessment.state)
  const visual = TONES[tone]
  const Icon = assessment.state === 'NOT CONFIGURED' ? UNCONFIGURED_ICON : visual.icon
  const isCritical = assessment.state === 'CRITICAL'

  return (
    <section
      aria-label="System safety status"
      className={`panel relative overflow-hidden ${visual.softBg} ${
        isCritical ? 'animate-attention' : ''
      }`}
    >
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-2 ${visual.bar}`} />

      <p className="sr-only" role="status" aria-live="polite">
        {assessment.state}. {SUBLABELS[assessment.state]}. {assessment.explanation}
      </p>

      <div className="flex flex-row items-center gap-8 px-6 py-6">
        <div className="flex min-w-0 items-center gap-5">
          <div
            className={`flex size-[72px] shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_10px_24px_-14px_rgb(14_23_38/0.6)] ${visual.solidBg}`}
          >
            <Icon size={38} strokeWidth={2.3} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className={`eyebrow ${visual.text}`}>System safety status</p>
            <h2
              className={`mt-0.5 text-[52px] leading-[1.02] font-extrabold tracking-[-0.02em] uppercase ${visual.textStrong}`}
            >
              {assessment.state}
            </h2>
            <p className={`mt-1 text-[16px] font-bold ${visual.textStrong}`}>
              {SUBLABELS[assessment.state]}
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1 border-l border-white/70 pl-8">
          <p className="text-ink-800 max-w-3xl text-[18px] leading-snug font-semibold">
            {assessment.explanation}
          </p>

          {assessment.checks.length > 0 && (
            <ul className="text-ink-700 mt-3 grid grid-cols-3 gap-x-6 gap-y-1.5">
              {assessment.checks.slice(0, 3).map((check) => (
                <li key={check} className="flex items-start gap-2 text-[13.5px] leading-snug">
                  <ClipboardCheck
                    size={15}
                    strokeWidth={2.4}
                    className={`${visual.text} mt-0.5 shrink-0`}
                    aria-hidden="true"
                  />
                  <span>{check}</span>
                </li>
              ))}
            </ul>
          )}

          {assessment.usingStaleData && (
            <p className="text-warn-800 mt-3 inline-flex items-center gap-2 rounded-lg border border-warn-200 bg-cream px-3 py-1 text-[12.5px] font-bold">
              <Move size={14} strokeWidth={2.4} aria-hidden="true" />
              On-screen values are the last known readings, not live data
            </p>
          )}
        </div>
      </div>
    </section>
  )
}