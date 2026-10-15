import type { LucideIcon } from 'lucide-react'
import {
  CircleCheck,
  CircleQuestionMark,
  Clock,
  Info,
  Siren,
  TriangleAlert,
  WifiOff,
} from 'lucide-react'

import type { ReadingLevel, SafetyState } from '@/types/reading'

/**
 * Status tones
 * ------------
 * Colour is never the only signal: every tone also carries an icon and a word,
 * so the screen stays readable for colour-vision-deficient users and on
 * washed-out ward displays.
 */
export type Tone = 'normal' | 'info' | 'warning' | 'critical' | 'offline' | 'stale'

export interface ToneVisual {
  icon: LucideIcon
  /** Short word shown next to the icon. */
  word: string
  /** Screen-reader glyph so status is unambiguous when read aloud. */
  glyph: string
  text: string
  textStrong: string
  softBg: string
  border: string
  solidBg: string
  ring: string
  dot: string
  bar: string
  /** Chart / accent colour. */
  accent: string
}

export const TONES: Record<Tone, ToneVisual> = {
  normal: {
    icon: CircleCheck,
    word: 'NORMAL',
    glyph: 'normal',
    text: 'text-safe-700',
    textStrong: 'text-safe-800',
    softBg: 'bg-safe-50',
    border: 'border-safe-200',
    solidBg: 'bg-safe-500',
    ring: 'ring-safe-500/25',
    dot: 'bg-safe-500',
    bar: 'bg-safe-500',
    accent: '#4BB8AF',
  },
  info: {
    icon: Info,
    word: 'INFO',
    glyph: 'information',
    text: 'text-bright-600',
    textStrong: 'text-brand-700',
    softBg: 'bg-brand-50',
    border: 'border-brand-200',
    solidBg: 'bg-bright-500',
    ring: 'ring-bright-500/25',
    dot: 'bg-bright-500',
    bar: 'bg-bright-500',
    accent: '#1591DC',
  },
  warning: {
    icon: TriangleAlert,
    word: 'WARNING',
    glyph: 'warning',
    text: 'text-warn-700',
    textStrong: 'text-warn-800',
    softBg: 'bg-cream',
    border: 'border-warn-200',
    solidBg: 'bg-warn-500',
    ring: 'ring-warn-500/30',
    dot: 'bg-warn-500',
    bar: 'bg-warn-500',
    accent: '#FF9100',
  },
  critical: {
    icon: Siren,
    word: 'CRITICAL',
    glyph: 'critical alert',
    text: 'text-crit-700',
    textStrong: 'text-crit-800',
    softBg: 'bg-crit-50',
    border: 'border-crit-200',
    solidBg: 'bg-crit-500',
    ring: 'ring-crit-500/30',
    dot: 'bg-crit-500',
    bar: 'bg-crit-500',
    accent: '#DF301C',
  },
  offline: {
    icon: WifiOff,
    word: 'OFFLINE',
    glyph: 'no connection',
    text: 'text-ink-600',
    textStrong: 'text-ink-800',
    softBg: 'bg-ink-100',
    border: 'border-ink-300',
    solidBg: 'bg-ink-500',
    ring: 'ring-ink-400/30',
    dot: 'bg-ink-400',
    bar: 'bg-ink-400',
    accent: '#7388a0',
  },
  stale: {
    icon: Clock,
    word: 'STALE',
    glyph: 'data stale',
    text: 'text-warn-700',
    textStrong: 'text-warn-800',
    softBg: 'bg-cream',
    border: 'border-warn-200',
    solidBg: 'bg-warn-500',
    ring: 'ring-warn-500/30',
    dot: 'bg-warn-500',
    bar: 'bg-warn-500',
    accent: '#FF9100',
  },
}

/** Screen reader glyph for the "not configured" state, which reuses offline. */
export const UNCONFIGURED_ICON = CircleQuestionMark

export const toneForLevel = (level: ReadingLevel): Tone =>
  level === 'critical' ? 'critical' : level === 'attention' ? 'warning' : level === 'normal' ? 'normal' : 'offline'

export const toneForState = (state: SafetyState): Tone => {
  switch (state) {
    case 'CRITICAL':
      return 'critical'
    case 'WARNING':
      return 'warning'
    case 'DATA STALE':
      return 'stale'
    case 'CONNECTION LOST':
    case 'NOT CONFIGURED':
      return 'offline'
    default:
      return 'normal'
  }
}
