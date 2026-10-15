import { useEffect, useState, type ReactNode } from 'react'

/**
 * The dashboard is authored at a single fixed logical size — 1920 × 1080 —
 * and then scaled as one unit to fit whatever screen it is shown on.
 */
export const DESIGN_WIDTH = 1920
export const DESIGN_HEIGHT = 1080

function computeScale(): number {
  if (typeof window === 'undefined') return 1
  const vw = window.innerWidth
  const vh = window.innerHeight
  if (vw === 0 || vh === 0) return 1
  return Math.min(vw / DESIGN_WIDTH, vh / DESIGN_HEIGHT)
}

/**
 * Scale-to-fit stage
 * ------------------
 * Renders the whole dashboard on a fixed 1920 × 1080 canvas and uniformly
 * scales that canvas so the **entire** interface is always visible at once,
 * with no scrolling and no clipped panels, on any display. Whatever space is
 * left over becomes a black letterbox frame around the dashboard.
 *
 * Because the canvas is fixed, the layout never reflows: the same single
 * screen (and its animations) simply gets smaller or larger.
 */
export function ScaledStage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(computeScale)

  useEffect(() => {
    const fit = () => setScale(computeScale())
    window.addEventListener('resize', fit)
    window.addEventListener('orientationchange', fit)
    return () => {
      window.removeEventListener('resize', fit)
      window.removeEventListener('orientationchange', fit)
    }
  }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-black">
      <div
        data-stage="true"
        className="overflow-hidden"
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          flex: 'none',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
    </div>
  )
}
