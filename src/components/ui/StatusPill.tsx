import type { LucideIcon } from 'lucide-react'

import { TONES, type Tone } from '@/lib/statusVisuals'

interface StatusPillProps {
  tone: Tone
  /** Overrides the tone's default word (e.g. "Stable", "Detected"). */
  label?: string
  icon?: LucideIcon
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Status chip. Always renders an icon + word so meaning never depends on
 * colour alone.
 */
export function StatusPill({ tone, label, icon, size = 'sm', className = '' }: StatusPillProps) {
  const visual = TONES[tone]
  const Icon = icon ?? visual.icon
  const text = label ?? visual.word
  const pad = size === 'md' ? 'px-3 py-1.5 text-[13px]' : 'px-2 py-1 text-[11.5px]'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-[0.02em] whitespace-nowrap ${pad} ${visual.softBg} ${visual.border} ${visual.text} ${className}`}
    >
      <Icon size={size === 'md' ? 15 : 13} strokeWidth={2.4} aria-hidden="true" />
      {text}
    </span>
  )
}

interface DotProps {
  tone: Tone
  pulse?: boolean
  size?: number
  className?: string
}

/** Small connection/state dot. The pulse is subtle and disabled for reduced motion. */
export function StatusDot({ tone, pulse = false, size = 8, className = '' }: DotProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-full ${TONES[tone].dot} ${
        pulse ? 'animate-pulse-live' : ''
      } ${className}`}
      style={{ width: size, height: size }}
    />
  )
}