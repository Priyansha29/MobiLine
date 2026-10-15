interface SparklineProps {
  /** Recent values, oldest first. `null` = missing sample (drawn as a gap). */
  values: Array<number | null>
  color: string
  className?: string
}

/**
 * Lightweight SVG sparkline for the measurement panels. Missing samples break
 * the line instead of being drawn as zero, so gaps are visible at a glance.
 */
export function Sparkline({ values, color, className = '' }: SparklineProps) {
  const valid = values.filter((v): v is number => v !== null && Number.isFinite(v))
  const width = 100
  const height = 30
  const pad = 3

  let min = 0
  let max = 1
  if (valid.length > 0) {
    min = Math.min(...valid)
    max = Math.max(...valid)
    if (max - min < 1e-9) {
      min -= 0.5
      max += 0.5
    }
  }
  const span = max - min || 1
  const stepX = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0
  const y = (v: number) => pad + (height - pad * 2) * (1 - (v - min) / span)

  // Split into contiguous segments so gaps in the data stay gaps.
  const segments: string[][] = []
  let currentSegment: string[] = []
  values.forEach((value, index) => {
    if (value === null || !Number.isFinite(value)) {
      if (currentSegment.length > 0) segments.push(currentSegment)
      currentSegment = []
      return
    }
    const x = pad + stepX * index
    currentSegment.push(`${x.toFixed(2)},${y(value).toFixed(2)}`)
  })
  if (currentSegment.length > 0) segments.push(currentSegment)

  const lastValid = [...values].reverse().find((v): v is number => v !== null && Number.isFinite(v))
  const lastIndex = values.lastIndexOf(lastValid as number)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      {segments.length === 0 && (
        <line
          x1={pad}
          y1={height / 2}
          x2={width - pad}
          y2={height / 2}
          stroke="#c2d2e2"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {segments.map((points, index) => (
        <polyline
          key={index}
          points={points.join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={2.2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {lastValid !== undefined && lastIndex >= 0 && (
        <circle
          cx={pad + stepX * lastIndex}
          cy={y(lastValid)}
          r={2.6}
          fill={color}
          stroke="#ffffff"
          strokeWidth={1.4}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  )
}