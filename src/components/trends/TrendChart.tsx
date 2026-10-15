import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { CHART, axisTick, fullTime, shortTime, timeTicks } from '@/lib/charts/theme'

export interface TrendPoint {
  t: number
  value: number | null
}

interface ReferenceMarker {
  value: number
  color: string
  label?: string
}

interface TrendChartProps {
  title: string
  subtitle: string
  points: TrendPoint[]
  color: string
  unit: string
  yDomain: [number, number]
  ticks: number[]
  format: (value: number) => string
  from: number
  to: number
  referenceLines?: ReferenceMarker[]
  footnote?: string
}

/**
 * Lightweight rolling trend plot. Missing samples (`null`) break the line so a
 * gap in the data can never be read as a zero value.
 */
export function TrendChart({
  title,
  subtitle,
  points,
  color,
  unit,
  yDomain,
  ticks,
  format,
  from,
  to,
  referenceLines = [],
  footnote,
}: TrendChartProps) {
  const tickValues = useMemo(() => timeTicks(from, to, 3), [from, to])
  const hasData = points.some((point) => point.value !== null)

  return (
    <section className="panel flex min-h-[240px] flex-1 flex-col" aria-label={title}>
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-ink-100 px-4 py-2.5">
        <h3 className="text-ink-800 text-[14.5px] font-bold tracking-[-0.01em]">{title}</h3>
        <p className="text-ink-500 text-[12px] font-semibold">{subtitle}</p>
      </header>

      <div className="relative min-h-0 flex-1 px-2 py-2">
        {!hasData && (
          <p className="text-ink-400 absolute inset-0 z-10 flex items-center justify-center text-[14px] font-semibold">
            No data received yet
          </p>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 10, right: 14, bottom: 2, left: -8 }}>
            <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
            {referenceLines.map((marker, index) => (
              <ReferenceLine
                key={marker.label ?? `ref-${index}`}
                y={marker.value}
                stroke={marker.color}
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={
                  marker.label
                    ? {
                        value: marker.label,
                        position: 'insideTopRight',
                        fill: marker.color,
                        fontSize: 12,
                        fontWeight: 700,
                      }
                    : undefined
                }
              />
            ))}
            <XAxis
              dataKey="t"
              type="number"
              domain={[from, to]}
              ticks={tickValues}
              tickFormatter={shortTime}
              tick={axisTick}
              stroke={CHART.grid}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              domain={yDomain}
              ticks={ticks}
              tickFormatter={(value: number) => format(value)}
              tick={axisTick}
              stroke={CHART.grid}
              tickLine={false}
              width={58}
              label={{
                value: unit,
                angle: -90,
                position: 'insideLeft',
                fill: CHART.label,
                fontSize: 12,
                fontWeight: 700,
                offset: 16,
              }}
            />
            <Tooltip
              content={<TrendTooltip format={format} unit={unit} color={color} />}
              cursor={{ stroke: CHART.brand, strokeWidth: 1, strokeDasharray: '4 3' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.6}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {footnote && <p className="text-ink-500 px-4 pb-2.5 text-[11.5px]">{footnote}</p>}
    </section>
  )
}

function TrendTooltip({
  active,
  payload,
  format,
  unit,
  color,
}: {
  active?: boolean
  payload?: Array<{ payload: TrendPoint; value: number }>
  format: (value: number) => string
  unit: string
  color: string
}) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-lg border border-ink-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-ink-500 text-[12px] font-semibold tnum">{fullTime(point.t)}</p>
      <p className="tnum text-[18px] font-bold" style={{ color }}>
        {format(payload[0].value)} <span className="text-[12px] font-semibold">{unit}</span>
      </p>
    </div>
  )
}