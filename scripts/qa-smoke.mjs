/**
 * DEVELOPMENT-ONLY smoke test
 * ---------------------------
 * Drives a real Chrome against the dashboard and checks the things that are
 * easy to break: no console errors, live values render, the page does not
 * scroll at 1920×1080, and the connection indicator is honest.
 *
 * Prerequisites:
 *   1. node scripts/mock-esp32.mjs
 *   2. VITE_API_BASE=http://localhost:8099 npm run dev
 *   3. CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe" node scripts/qa-smoke.mjs
 *
 * Exits non-zero if any check fails.
 */
import puppeteer from 'puppeteer-core'

const URL = process.env.DASH_URL ?? 'http://localhost:5173'
const CHROME =
  process.env.CHROME_PATH ??
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

const checks = []
const check = (name, pass, detail = '') => {
  checks.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--window-size=1920,1080'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1920, height: 1080 })

const consoleErrors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})
page.on('pageerror', (err) => consoleErrors.push(String(err)))

await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30_000 })
await new Promise((r) => setTimeout(r, 4000))

const text = await page.evaluate(() => document.body.innerText)
check('renders IVGuard title', text.includes('IVGuard'))
check('renders tubing tension panel', text.includes('TUBING TENSION'))
check('renders trend charts', text.includes('Live Trend'))
check(
  'shows ESP32 CONNECTED with the simulator',
  text.includes('ESP32 CONNECTED'),
)
check('no console errors', consoleErrors.length === 0, consoleErrors.join(' | '))

const metrics = await page.evaluate(() => {
  const root = document.documentElement
  return {
    scrollHeight: root.scrollHeight,
    clientHeight: root.clientHeight,
    scrollWidth: root.scrollWidth,
    clientWidth: root.clientWidth,
  }
})
check(
  'no vertical scroll at 1920×1080',
  metrics.scrollHeight <= metrics.clientHeight + 1,
  `${metrics.scrollHeight} > ${metrics.clientHeight}`,
)
check(
  'no horizontal scroll at 1920×1080',
  metrics.scrollWidth <= metrics.clientWidth + 1,
  `${metrics.scrollWidth} > ${metrics.clientWidth}`,
)

// Confirm values actually update.
const first = await page.evaluate(() => document.body.innerText)
await new Promise((r) => setTimeout(r, 2500))
const second = await page.evaluate(() => document.body.innerText)
check('live values update over time', first !== second)

await browser.close()

const failed = checks.filter((c) => !c.pass)
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`)
process.exit(failed.length === 0 ? 0 : 1)