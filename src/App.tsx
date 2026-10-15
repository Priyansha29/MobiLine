import { DashboardScreen } from '@/components/DashboardScreen'
import { ScaledStage } from '@/components/layout/ScaledStage'

/**
 * IVGuard — single-screen patient-side IV line safety monitor.
 * The dashboard is intentionally non-interactive: one fixed screen, live
 * readings from the ESP32 `/data` endpoint. It is rendered at a fixed logical
 * size and scaled to fit the display, so the whole screen is always visible at
 * once (no scrolling), framed by black on any leftover space.
 */
export default function App() {
  return (
    <ScaledStage>
      <DashboardScreen />
    </ScaledStage>
  )
}
