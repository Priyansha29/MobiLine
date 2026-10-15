/**
 * TEST-ONLY ESP32 simulator
 * -------------------------
 * This is NOT part of the dashboard and is NOT used at runtime. It exists so
 * the frontend can be exercised end-to-end without the physical prototype.
 *
 *   node scripts/mock-esp32.mjs            # serves http://0.0.0.0:8099/data
 *   MOCK_PORT=9000 node scripts/mock-esp32.mjs
 *
 * Point the dashboard at it:
 *   VITE_API_BASE=http://localhost:8099 npm run dev
 *
 * It sends the same payload shape and CORS headers the firmware should send,
 * and walks through normal → movement → warning → critical → recovery → drip
 * change so every UI state can be observed.
 */
import { createServer } from 'node:http'

const PORT = Number(process.env.MOCK_PORT ?? 8099)
const startedAt = Date.now()
const PHASE_MS = 20_000

const PHASES = [
  { name: 'normal', tension: [0.06, 0.22], distance: [18, 26], drip: [18, 22], movement: false, angle: [0.2, 1.8] },
  { name: 'movement', tension: [0.35, 0.55], distance: [26, 32], drip: [16, 21], movement: true, angle: [-2, 3] },
  { name: 'tension warning', tension: [0.72, 0.9], distance: [27, 33], drip: [15, 20], movement: false, angle: [0.5, 3] },
  { name: 'critical', tension: [1.05, 1.25], distance: [46, 52], drip: [12, 18], movement: true, angle: [2, 6] },
  { name: 'recovery', tension: [0.1, 0.3], distance: [20, 27], drip: [16, 21], movement: false, angle: [0.5, 2] },
  { name: 'drip change', tension: [0.12, 0.28], distance: [21, 27], drip: [3, 7], movement: false, angle: [0.5, 2] },
]

const rand = ([min, max]) => min + Math.random() * (max - min)
const round = (value, digits) => Number(value.toFixed(digits))

function reading() {
  const elapsed = Date.now() - startedAt
  const phase = PHASES[Math.floor(elapsed / PHASE_MS) % PHASES.length]

  const tension = round(rand(phase.tension), 2)
  const distance = round(rand(phase.distance), 1)
  const drip = Math.round(rand(phase.drip))
  const angle = round(rand(phase.angle), 1)

  const status =
    tension >= 1.0 || distance >= 45
      ? 'CRITICAL'
      : tension >= 0.7 || distance >= 35 || (phase.movement && tension >= 0.6)
        ? 'WARNING'
        : 'NORMAL'

  return {
    timestamp: elapsed,
    tension,
    extension: distance,
    bed_angle: angle,
    drip_rate: drip,
    movement: phase.movement ? Math.random() > 0.25 : Math.random() > 0.94,
    acceleration: round(1 + (phase.movement ? rand([-0.18, 0.22]) : rand([-0.03, 0.03])), 3),
    accel_x: round(rand([-0.08, 0.08]), 3),
    accel_y: round(rand([-0.08, 0.08]), 3),
    accel_z: round(rand([0.96, 1.04]), 3),
    status,
    _phase: phase.name,
  }
}

const server = createServer((req, res) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors)
    res.end()
    return
  }

  if (req.url?.startsWith('/data')) {
    res.writeHead(200, { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    res.end(JSON.stringify(reading()))
    return
  }

  res.writeHead(200, { ...cors, 'Content-Type': 'text/plain' })
  res.end('IVGuard test-only ESP32 simulator. GET /data for a sample.\n')
})

server.listen(PORT, () => {
  console.log(`[mock-esp32] test-only simulator on http://localhost:${PORT}/data`)
  console.log('[mock-esp32] phases rotate every 20 s: normal → movement → warning → critical → recovery → drip change')
})