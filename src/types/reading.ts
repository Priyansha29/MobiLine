/**
 * IVGuard — device reading contract
 * ---------------------------------
 * The ESP32 `/data` endpoint returns a flat JSON object. Every sensor field is
 * normalised to `number | null`; a field that is missing or unparseable becomes
 * `null` and is shown as "—", never as a fabricated zero.
 *
 * Example payload:
 * {
 *   "timestamp": 183421,     // milliseconds since ESP32 boot
 *   "tension": 0.04,         // newtons
 *   "bed_angle": 1.1,        // degrees (MPU6500 accelerometer-derived tilt)
 *   "drip_rate": 18,         // drops per minute
 *   "movement": false,
 *   "acceleration": 1.002,
 *   "accel_x": 0.021,
 *   "accel_y": -0.014,
 *   "accel_z": 1.001,
 *   "status": "NORMAL"
 * }
 */

export type DeviceStatus = 'NORMAL' | 'WARNING' | 'CRITICAL'

/** Overall safety state shown in the main banner. */
export type SafetyState =
  | 'NORMAL'
  | 'WARNING'
  | 'CRITICAL'
  | 'CONNECTION LOST'
  | 'DATA STALE'
  | 'NOT CONFIGURED'

/** Effective health of the HTTP link to the ESP32. */
export type LinkState = 'unconfigured' | 'connecting' | 'live' | 'stale' | 'disconnected'

/** One normalised sample from the device. */
export interface Reading {
  /** Client timestamp (epoch ms) when the sample was received. */
  receivedAt: number
  /** Device uptime in milliseconds, when reported. */
  deviceUptimeMs: number | null
  /** Tubing tension in newtons. */
  tension: number | null
  /** MPU6500 accelerometer-derived tilt in degrees. */
  tiltAngle: number | null
  /** Drip rate in drops per minute. */
  dripRate: number | null
  /** Motion flag from the MPU6500. */
  movement: boolean | null
  /** Total acceleration magnitude in g. */
  acceleration: number | null
  accelX: number | null
  accelY: number | null
  accelZ: number | null
  /** Status word reported by the device (advisory input only). */
  deviceStatus: DeviceStatus | null
}

/** Diagnostics for the HTTP link, kept independent of the readings. */
export interface LinkInfo {
  state: LinkState
  /** Full endpoint being polled, or '' when unconfigured. */
  endpoint: string
  /** Epoch ms of the last successful sample. */
  lastSuccessAt: number | null
  /** Epoch ms of the last request attempt. */
  lastAttemptAt: number | null
  /** Last error message, if the most recent attempt failed. */
  lastError: string | null
  /** Number of consecutive failed attempts. */
  consecutiveFailures: number
  /** Total successful samples since load. */
  packetsReceived: number
  /** Round-trip time of the most recent successful request, in ms. */
  latencyMs: number | null
}

/** A single non-interactive entry in the recent-events feed. */
export interface DashEvent {
  id: string
  /** Epoch ms. */
  t: number
  message: string
  level: 'normal' | 'info' | 'warning' | 'critical'
}

/** Result of evaluating a reading against the prototype rules. */
export interface SafetyAssessment {
  state: SafetyState
  /** One-line explanation of the current alert (or "all within range"). */
  explanation: string
  /** Concrete, non-diagnostic "check this" steps. */
  checks: string[]
  /** True when the displayed values are the last known ones but not fresh. */
  usingStaleData: boolean
}

/** Per-reading qualitative state used by the measurement panels. */
export type ReadingLevel = 'normal' | 'attention' | 'critical' | 'unknown'
