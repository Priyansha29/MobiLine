/**
 * DEVELOPMENT-ONLY screenshot capture
 * -----------------------------------
 * Waits for the mock simulator to reach specific phases, then captures the
 * dashboard at 1920×1080 and 1366×768 into preview/.
 *
 *   node scripts/mock-esp32.mjs
 *   VITE_API_BASE=http://localhost:8099 npm run dev
 *   node scripts/qa-shots.mjs
 */
import { mkdirSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const URL = process.env.DASH_URL ?? 'http://localhost:5173'
const MOCK = process.env.MOCK_URL ?? 'http://localhost:8099/data'
const CHROME =
  process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

mkdirSync('preview', { recursive: true })

const phase = async () => {
  try {
    const res = await fetch(MOCK, { cache: 'no-store' })
    return (await res.json())._phase ?? null
  } catch {
    return null
  }
}

const waitForPhase = async (target, timeoutMs = 90_000) => {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if ((await phase()) === target) return true
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--window-size=1920,1080', '--hide-scrollbars'],
})
const page = await browser.newPage()
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

await page.setViewport({ width: 1920, height: 1080 })
await page.goto(URL, { waitUntil: 'networkidle2' })

const shots = [
  ['normal', 'ivguard-1920-normal.png', 1920, 1080],
  ['tension warning', 'ivguard-1920-warning.png', 1920, 1080],
  ['critical', 'ivguard-1920-critical.png', 1920, 1080],
  ['normal', 'ivguard-1366-normal.png', 1366, 768],
  ['normal', 'ivguard-1280-normal.png', 1280, 800],
]

for (const [targetPhase, file, width, height] of shots) {
  await page.setViewport({ width, height })
  const reached = await waitForPhase(targetPhase)
  await new Promise((r) => setTimeout(r, 1500))
  await page.screenshot({ path: `preview/${file}` })
  console.log(`${reached ? 'captured' : 'phase timeout'} ${file}`)
}

await browser.close()
console.log(errors.length ? `console errors:\n${errors.join('\n')}` : 'no console errors')