/**
 * Prototype thresholds
 * --------------------
 * These mirror the ESP32 firmware's demonstration limits. They are NOT
 * clinically validated and exist only to exercise the alert behaviour of the
 * academic prototype. Every threshold is expressed once, here, so the frontend
 * and firmware cannot drift apart.
 */
export const THRESHOLDS = {
  /** Tension at or above this is a prototype warning (matches firmware). */
  tensionWarningN: 0.7,
  /** Tension at or above this is prototype critical (matches firmware). */
  tensionCriticalN: 1.0,
  /** Drip rate below this is an advisory (frontend-only; not a firmware limit). */
  dripLowDpm: 10,
  /** Fractional change vs. the recent baseline that flags "drip activity changed". */
  dripChangeFraction: 0.5,
  /** Sustained seconds at zero drops before flagging "no drops detected". */
  dripZeroGraceSeconds: 5,
  /** Display scale maximum for the tension gauge. */
  tensionScaleMaxN: 1.4,
  /** Tilt angle above which the structure is flagged as notably tilted. */
  tiltElevatedDeg: 45,
} as const

/** Shown wherever thresholds appear so they are never read as medical limits. */
export const THRESHOLDS_NOTE =
  'Prototype thresholds — demonstration values only, not clinically validated.'
