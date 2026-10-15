import { formatAgo } from './format'
import { THRESHOLDS } from './thresholds'
import type {
  LinkInfo,
  Reading,
  ReadingLevel,
  SafetyAssessment,
} from '@/types/reading'

/**
 * Prototype status rules
 * ----------------------
 * Engineering heuristics that demonstrate alerting for the academic prototype.
 * They are not medical logic and must not be read as clinical guidance. The
 * device's own `status` field is one input among several — the dashboard also
 * checks the raw values against the same thresholds the firmware uses, and
 * connection/staleness always take precedence over a "NORMAL" reading.
 */

/** Rolling drip-activity context assembled by the data hook. */
export interface DripContext {
  /** Median drip rate over the preceding window (drops/min), or null. */
  baseline: number | null
  /** Continuous time (ms) the drip rate has read zero. */
  zeroForMs: number
  /** Continuous time (ms) the drip rate has read below the low advisory. */
  lowForMs: number
}

export type DripAdvisory = 'none' | 'low' | 'changed' | 'no-drops' | 'unknown'

const EMPTY_CHECKS: string[] = []

function tensionChecks(level: ReadingLevel): string[] {
  if (level === 'unknown' || level === 'normal') return []
  return [
    'Inspect the IV tubing for pulling or tension',
    'Check for kinks, loops or a closed clamp',
    'Review the tubing path along the bed',
  ]
}

// ---------------------------------------------------------------------------
// Per-reading states (used by the measurement panels)
// ---------------------------------------------------------------------------

export function tensionLevel(tension: number | null): ReadingLevel {
  if (tension === null) return 'unknown'
  if (tension >= THRESHOLDS.tensionCriticalN) return 'critical'
  if (tension >= THRESHOLDS.tensionWarningN) return 'attention'
  return 'normal'
}

export function tiltLevel(tilt: number | null): ReadingLevel {
  if (tilt === null) return 'unknown'
  return Math.abs(tilt) >= THRESHOLDS.tiltElevatedDeg ? 'attention' : 'normal'
}

export function dripLevel(drip: number | null, ctx: DripContext): ReadingLevel {
  const advisory = dripAdvisory(drip, ctx)
  if (advisory === 'unknown') return 'unknown'
  return advisory === 'none' ? 'normal' : 'attention'
}

export function movementLevel(movement: boolean | null): ReadingLevel {
  if (movement === null) return 'unknown'
  return movement ? 'attention' : 'normal'
}

/**
 * Classify drip activity. A missing reading is "unknown"; a sustained zero is
 * "no-drops" (distinct from a single genuine zero sample); a large swing from
 * the recent baseline is "changed".
 */
export function dripAdvisory(drip: number | null, ctx: DripContext): DripAdvisory {
  if (drip === null) return 'unknown'
  if (drip <= 0) {
    return ctx.zeroForMs >= THRESHOLDS.dripZeroGraceSeconds * 1000 ? 'no-drops' : 'none'
  }
  const baseline = ctx.baseline
  if (baseline !== null && baseline >= 4) {
    const ratio = drip / baseline
    if (ratio <= 1 - THRESHOLDS.dripChangeFraction || ratio >= 1 + THRESHOLDS.dripChangeFraction * 1.5) {
      return 'changed'
    }
  }
  if (drip < THRESHOLDS.dripLowDpm && ctx.lowForMs >= 4000) return 'low'
  return 'none'
}

// ---------------------------------------------------------------------------
// Overall assessment
// ---------------------------------------------------------------------------

const CONNECTION_CHECKS = [
  'Confirm the ESP32 is powered and on the same Wi-Fi hotspot',
  'Check the /data endpoint address in VITE_API_BASE',
  'Reload the dashboard once the device is reachable',
]

export function assess(
  reading: Reading | null,
  link: LinkInfo,
  now: number,
  ctx: DripContext,
): SafetyAssessment {
  const usingStaleData =
    link.state === 'stale' || (link.state === 'disconnected' && link.lastSuccessAt !== null)

  if (link.state === 'unconfigured') {
    return {
      state: 'NOT CONFIGURED',
      explanation:
        'No ESP32 endpoint is configured, so live readings are unavailable. Set VITE_API_BASE to the device address.',
      checks: ['Configure the ESP32 base URL', 'Reload the dashboard'],
      usingStaleData: false,
    }
  }

  if (link.state === 'connecting') {
    return {
      state: 'CONNECTION LOST',
      explanation: 'Unable to receive live sensor data — contacting the ESP32.',
      checks: CONNECTION_CHECKS,
      usingStaleData: false,
    }
  }

  if (link.state === 'disconnected') {
    return {
      state: 'CONNECTION LOST',
      explanation: link.lastSuccessAt
        ? `Live readings unavailable — the ESP32 stopped responding. Last update ${formatAgo(link.lastSuccessAt, now)}.`
        : 'Unable to receive live sensor data.',
      checks: CONNECTION_CHECKS,
      usingStaleData,
    }
  }

  if (link.state === 'stale') {
    return {
      state: 'DATA STALE',
      explanation: link.lastSuccessAt
        ? `Unable to receive live sensor data — last update ${formatAgo(link.lastSuccessAt, now)}.`
        : 'Unable to receive live sensor data.',
      checks: CONNECTION_CHECKS,
      usingStaleData: true,
    }
  }

  if (!reading) {
    return {
      state: 'CONNECTION LOST',
      explanation: 'No usable reading has been received from the ESP32.',
      checks: CONNECTION_CHECKS,
      usingStaleData: false,
    }
  }

  const checks = new Set<string>()
  const criticalReasons: string[] = []
  const warningReasons: string[] = []

  const tension = reading.tension
  const tLevel = tensionLevel(tension)
  const tensionElevated = tLevel === 'attention' || tLevel === 'critical'

  if (tLevel === 'critical') {
    criticalReasons.push('Tubing tension is at or above the configured prototype critical level.')
    tensionChecks(tLevel).forEach((c) => checks.add(c))
  } else if (tLevel === 'attention') {
    warningReasons.push('Tubing tension elevated.')
    tensionChecks(tLevel).forEach((c) => checks.add(c))
  }

  if (reading.movement === true && tensionElevated) {
    warningReasons.push('Movement detected with elevated tension. Inspect tubing.')
    checks.add('Inspect the line where the structure moved')
  }

  const drip = dripAdvisory(reading.dripRate, ctx)
  if (drip === 'no-drops') {
    warningReasons.push('No drip activity detected — inspect the drip sensor and IV line.')
    checks.add('Inspect the drip sensor and IV line')
  } else if (drip === 'changed') {
    warningReasons.push('Drip activity changed — inspect the line.')
    checks.add('Inspect the drip chamber and roller clamp')
  } else if (drip === 'low') {
    warningReasons.push('Drip rate is below the expected range — inspect the line.')
    checks.add('Inspect the drip chamber and roller clamp')
  }

  if (reading.deviceStatus === 'CRITICAL') {
    criticalReasons.push('The ESP32 reported a critical condition.')
  } else if (
    reading.deviceStatus === 'WARNING' &&
    criticalReasons.length === 0 &&
    warningReasons.length === 0
  ) {
    warningReasons.push('The ESP32 reported a warning condition.')
    checks.add('Inspect the IV line')
  }

  if (criticalReasons.length > 0) {
    return {
      state: 'CRITICAL',
      explanation: criticalReasons[0],
      checks: checks.size ? [...checks] : ['Inspect the IV tubing immediately'],
      usingStaleData: false,
    }
  }

  if (warningReasons.length > 0) {
    return {
      state: 'WARNING',
      explanation: warningReasons[0],
      checks: checks.size ? [...checks] : ['Inspect the IV line'],
      usingStaleData: false,
    }
  }

  return {
    state: 'NORMAL',
    explanation: 'All monitored parameters are within the configured prototype thresholds.',
    checks: EMPTY_CHECKS,
    usingStaleData: false,
  }
}
