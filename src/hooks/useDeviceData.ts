import { useEffect, useRef, useState } from 'react'

import { CONFIG, DATA_URL, isConfigured } from '@/config'
import { createDeviceClient, deriveLinkState } from '@/lib/deviceClient'
import { createEventTracker, type EventTracker } from '@/lib/events'
import { assess, dripAdvisory, type DripAdvisory, type DripContext } from '@/lib/status'
import { THRESHOLDS } from '@/lib/thresholds'
import type {
  DashEvent,
  LinkInfo,
  Reading,
  SafetyAssessment,
} from '@/types/reading'

/**
 * useDeviceData
 * -------------
 * Owns the whole data pipeline: polling the ESP32, keeping a rolling history,
 * deriving connection state, running the prototype status rules and generating
 * events. Presentation components receive only plain values.
 */

export interface UseDeviceDataResult {
  current: Reading | null
  history: Reading[]
  link: LinkInfo
  assessment: SafetyAssessment
  events: DashEvent[]
  nowMs: number
  /** Drip-activity classification (frontend advisory, not a firmware limit). */
  drip: DripAdvisory
}

function initialLink(): LinkInfo {
  return {
    state: isConfigured ? 'connecting' : 'unconfigured',
    endpoint: DATA_URL,
    lastSuccessAt: null,
    lastAttemptAt: null,
    lastError: null,
    consecutiveFailures: 0,
    packetsReceived: 0,
    latencyMs: null,
  }
}

const EMPTY_DRIP: DripContext = { baseline: null, zeroForMs: 0, lowForMs: 0 }

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/** Continuous time (ms) the trailing samples have satisfied `match`. */
function trailingDuration(
  history: Reading[],
  now: number,
  match: (reading: Reading) => boolean,
): number {
  let start: number | null = null
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const reading = history[i]
    if (reading.dripRate === null) break
    if (match(reading)) {
      start = reading.receivedAt
    } else {
      break
    }
  }
  return start === null ? 0 : Math.max(0, now - start)
}

function buildDripContext(history: Reading[], now: number): DripContext {
  const cutoff = now - 60_000
  const baselineSamples: number[] = []
  for (const reading of history) {
    if (reading.dripRate === null) continue
    if (reading.receivedAt < cutoff) continue
    // Exclude the last few seconds so the baseline is not dragged by the
    // current value when assessing a change.
    if (reading.receivedAt > now - 8_000) continue
    baselineSamples.push(reading.dripRate)
  }
  return {
    baseline: median(baselineSamples),
    zeroForMs: trailingDuration(history, now, (r) => r.dripRate === 0),
    lowForMs: trailingDuration(
      history,
      now,
      (r) => r.dripRate !== null && r.dripRate > 0 && r.dripRate < THRESHOLDS.dripLowDpm,
    ),
  }
}

export function useDeviceData(): UseDeviceDataResult {
  const [current, setCurrent] = useState<Reading | null>(null)
  const [history, setHistory] = useState<Reading[]>([])
  const [link, setLink] = useState<LinkInfo>(() => initialLink())
  const [assessment, setAssessment] = useState<SafetyAssessment>(() =>
    assess(null, initialLink(), Date.now(), EMPTY_DRIP),
  )
  const [events, setEvents] = useState<DashEvent[]>([])
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [drip, setDrip] = useState<DripAdvisory>('unknown')

  const currentRef = useRef<Reading | null>(null)
  const historyRef = useRef<Reading[]>([])
  const linkRef = useRef<LinkInfo>(initialLink())
  const trackerRef = useRef<EventTracker | null>(null)
  if (trackerRef.current === null) trackerRef.current = createEventTracker()

  useEffect(() => {
    trackerRef.current ??= createEventTracker()
    const tracker = trackerRef.current

    const evaluate = (at: number) => {
      const rawLink = linkRef.current
      const effectiveLink: LinkInfo = {
        ...rawLink,
        state: deriveLinkState(rawLink, isConfigured, at),
      }
      linkRef.current = effectiveLink

      const reading = currentRef.current
      const context = buildDripContext(historyRef.current, at)
      const nextAssessment = assess(reading, effectiveLink, at, context)
      const newEvents = tracker.push(reading, nextAssessment, effectiveLink, at)

      setLink(effectiveLink)
      setAssessment(nextAssessment)
      setDrip(dripAdvisory(reading?.dripRate ?? null, context))
      setNowMs(at)
      if (newEvents.length > 0) {
        setEvents((prev) => [...newEvents.reverse(), ...prev].slice(0, CONFIG.eventLimit))
      }
    }

    const client = isConfigured
      ? createDeviceClient({
          url: DATA_URL,
          onReading: (reading) => {
            currentRef.current = reading
            const next = [...historyRef.current, reading].slice(-CONFIG.historyLimit)
            historyRef.current = next
            setCurrent(reading)
            setHistory(next)
            evaluate(Date.now())
          },
          onLink: (next) => {
            linkRef.current = next
          },
        })
      : null

    const tick = window.setInterval(() => evaluate(Date.now()), CONFIG.clockTickMs)

    // Evaluate once immediately so the UI reflects the configured state.
    evaluate(Date.now())

    return () => {
      window.clearInterval(tick)
      client?.stop()
    }
  }, [])

  return { current, history, link, assessment, events, nowMs, drip }
}
