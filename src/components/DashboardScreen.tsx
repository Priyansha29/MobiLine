import { useMemo } from 'react'

import { CONFIG } from '@/config'
import { useDeviceData } from '@/hooks/useDeviceData'
import { CHART } from '@/lib/charts/theme'
import { THRESHOLDS } from '@/lib/thresholds'

import { DeviceLinkPanel } from '@/components/DeviceLinkPanel'
import { RecentEvents } from '@/components/RecentEvents'
import { StatusBanner } from '@/components/StatusBanner'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { DripPanel } from '@/components/measurements/DripPanel'
import { MovementPanel } from '@/components/measurements/MovementPanel'
import { TensionPanel } from '@/components/measurements/TensionPanel'
import { TiltPanel } from '@/components/measurements/TiltPanel'
import { TrendChart, type TrendPoint } from '@/components/trends/TrendChart'

/**
 * The whole dashboard: one fixed, non-interactive screen. Every value comes
 * from the live ESP32 polling loop in `useDeviceData`.
 */
export function DashboardScreen() {
  const { current, history, link, assessment, events, nowMs, drip } = useDeviceData()

  const windowed = useMemo(
    () => history.filter((reading) => reading.receivedAt >= nowMs - CONFIG.historyWindowMs),
    [history, nowMs],
  )

  const tensionPoints = useMemo<TrendPoint[]>(
    () => windowed.map((reading) => ({ t: reading.receivedAt, value: reading.tension })),
    [windowed],
  )
  const dripPoints = useMemo<TrendPoint[]>(
    () => windowed.map((reading) => ({ t: reading.receivedAt, value: reading.dripRate })),
    [windowed],
  )
  const dripRecent = useMemo(
    () => history.slice(-40).map((reading) => reading.dripRate),
    [history],
  )

  const dripTop = useMemo(() => {
    const max = windowed.reduce((acc, reading) => Math.max(acc, reading.dripRate ?? 0), 0)
    if (max <= 20) return 30
    if (max <= 45) return 60
    return Math.ceil((max * 1.3) / 15) * 15
  }, [windowed])

  const dripTicks = [0, dripTop / 3, (dripTop * 2) / 3, dripTop].map((v) => Math.round(v))

  // Tension axis: keep the calibrated 0–1.4 N scale while readings are in range,
  // but expand it to fit larger incoming values so the live curve stays visible.
  // Thresholds are unchanged — only the axis maximum grows.
  const tensionTop = useMemo(() => {
    const base = THRESHOLDS.tensionScaleMaxN
    const max = windowed.reduce((acc, reading) => Math.max(acc, reading.tension ?? 0), 0)
    if (max <= base) return base
    const step = 10 ** Math.floor(Math.log10(max)) / 2
    return Math.ceil((max * 1.1) / step) * step
  }, [windowed])

  const tensionStretched = tensionTop !== THRESHOLDS.tensionScaleMaxN

  const tensionTicks = useMemo(() => {
    const base = THRESHOLDS.tensionScaleMaxN
    if (!tensionStretched) return [0, base * 0.25, base * 0.5, base * 0.75, base]
    return [0, tensionTop * 0.25, tensionTop * 0.5, tensionTop * 0.75, tensionTop]
  }, [tensionStretched, tensionTop])

  return (
    <div className="bg-ink-50 flex h-full flex-col">
      <a
        href="#dashboard"
        className="sr-only-focusable bg-brand-500 absolute top-3 left-3 z-50 rounded-lg px-4 py-2 text-[13px] font-semibold text-white"
      >
        Skip to dashboard
      </a>

      <Header link={link} current={current} nowMs={nowMs} />

      <main
        id="dashboard"
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4"
      >
        <StatusBanner assessment={assessment} />

        <div className="grid grid-cols-4 gap-3">
          <TensionPanel current={current} />
          <DripPanel current={current} recent={dripRecent} advisory={drip} />
          <TiltPanel current={current} />
          <MovementPanel current={current} />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-12 gap-3">
          <div className="col-span-8 grid min-h-0 grid-cols-2 gap-3">
            <TrendChart
              title="Tubing Tension — Live Trend"
              subtitle={`Last ${CONFIG.historyWindowMs / 1000} s`}
              points={tensionPoints}
              color={CHART.bright}
              unit="N"
              yDomain={[0, tensionTop]}
              ticks={tensionTicks}
              format={(value) => value.toFixed(2)}
              from={nowMs - CONFIG.historyWindowMs}
              to={nowMs}
              referenceLines={[
                {
                  value: THRESHOLDS.tensionWarningN,
                  color: CHART.warn,
                  // Hide the marker text when the axis is stretched far beyond the
                  // thresholds, so the two labels cannot pile up on the bottom axis.
                  label: tensionStretched
                    ? undefined
                    : `Warning ${THRESHOLDS.tensionWarningN.toFixed(2)} N`,
                },
                {
                  value: THRESHOLDS.tensionCriticalN,
                  color: CHART.crit,
                  label: tensionStretched
                    ? undefined
                    : `Critical ${THRESHOLDS.tensionCriticalN.toFixed(2)} N`,
                },
              ]}
              footnote="Real ESP32 readings · gaps in the line indicate missing samples, not zero."
            />
            <TrendChart
              title="Drip Rate — Live Trend"
              subtitle={`Last ${CONFIG.historyWindowMs / 1000} s`}
              points={dripPoints}
              color={CHART.cyan}
              unit="drops/min"
              yDomain={[0, dripTop]}
              ticks={dripTicks}
              format={(value) => value.toFixed(0)}
              from={nowMs - CONFIG.historyWindowMs}
              to={nowMs}
              footnote="Drop count only — not calibrated to mL/hour. Gaps indicate missing samples."
            />
          </div>

          <div className="col-span-4 flex min-h-0 flex-col">
            <RecentEvents events={events} />
          </div>
        </div>

        <DeviceLinkPanel link={link} current={current} nowMs={nowMs} />
      </main>

      <Footer />
    </div>
  )
}