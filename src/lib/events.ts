import type { DashEvent, LinkInfo, Reading, SafetyAssessment } from '@/types/reading'

/**
 * Event detector
 * --------------
 * Turns the incoming stream into the short, human-readable entries shown in the
 * recent-events feed. Events are generated **only** from real readings and real
 * connection changes — never invented. Simple debouncing keeps a noisy sensor
 * from flooding the list.
 */

let counter = 0
const nextId = () => `evt-${Date.now().toString(36)}-${(counter += 1)}`

interface TrackerState {
  linkState: LinkInfo['state']
  safetyState: SafetyAssessment['state']
  movement: boolean
}

export function createEventTracker() {
  const state: TrackerState = {
    linkState: 'connecting',
    safetyState: 'CONNECTION LOST',
    movement: false,
  }

  const make = (
    at: number,
    message: string,
    level: DashEvent['level'],
  ): DashEvent => ({
    id: nextId(),
    t: at,
    message,
    level,
  })

  return {
    reset() {
      state.linkState = 'connecting'
      state.safetyState = 'CONNECTION LOST'
      state.movement = false
    },

    /** Returns any new events produced by this evaluation, oldest first. */
    push(
      reading: Reading | null,
      assessment: SafetyAssessment,
      link: LinkInfo,
      now: number,
    ): DashEvent[] {
      const out: DashEvent[] = []

      // --- link transitions -------------------------------------------------
      if (link.state !== state.linkState) {
        const from = state.linkState
        const to = link.state
        if (to === 'unconfigured') {
          out.push(make(now, 'ESP32 endpoint not configured', 'warning'))
        } else if (to === 'disconnected') {
          out.push(make(now, 'ESP32 connection lost', 'critical'))
        } else if (to === 'stale') {
          out.push(make(now, 'Live data stale — no recent updates', 'warning'))
        } else if (to === 'live' && from !== 'live') {
          out.push(
            make(
              now,
              from === 'connecting' ? 'ESP32 connected — live data' : 'ESP32 connection restored',
              'normal',
            ),
          )
        }
        state.linkState = to
      }

      // --- safety-state transitions ----------------------------------------
      if (assessment.state !== state.safetyState) {
        const to = assessment.state
        if (to === 'CRITICAL') {
          out.push(make(now, `Critical condition — ${assessment.explanation}`, 'critical'))
        } else if (to === 'WARNING') {
          out.push(make(now, `Warning — ${assessment.explanation}`, 'warning'))
        } else if (to === 'NORMAL' && state.safetyState !== 'NORMAL') {
          out.push(make(now, 'All monitored parameters returned to normal', 'normal'))
        }
        state.safetyState = to
      }

      // --- movement onset / offset -----------------------------------------
      const movement = reading?.movement ?? null
      if (link.state === 'live' && movement !== null && movement !== state.movement) {
        if (movement) {
          out.push(make(now, 'Movement detected by MPU6500', 'info'))
        } else {
          out.push(make(now, 'Structure returned to rest — movement stopped', 'normal'))
        }
        state.movement = movement
      }

      return out
    },
  }
}

export type EventTracker = ReturnType<typeof createEventTracker>
