/**
 * DEVELOPMENT-ONLY state audit
 * -----------------------------
 * Verifies the dashboard's safety states against the test-only simulator:
 *
 *   node scripts/qa-states.mjs                 # LIVE → DATA STALE (stops the sim)
 *   MODE=unconfigured node scripts/qa-states.mjs   # NOT CONFIGURED (point at a
 *                                                  # build with no API base)
 *
 * It proves the dashboard keeps the last real readings, marks them stale, and
 * never fabricates values or claims live hardware when the device is gone.
 */
import { spawn } from 'node:child_process'

import puppeteer from 'puppeteer-core'

const DASH = process.env.DASH_URL ?? 'http://localhost:5173'
const CHROME =
  process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = Number(process.env.MOCK_PORT ?? 8099)
const MODE = process.env.MODE ?? 'live'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

async function waitForMock(url, tries = 60) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(url)
      if (res.ok) return true
    } catch {
      /* not up yet */
    }
    await sleep(250)
  }
  return false
}

// Read the large measurement read-outs (font >= 30 px) and the status word.
const readScreen = () => ({
  status: document
    .querySelector('section[aria-label="System safety status"] h2')
    ?.textContent?.trim(),
  bannerText:
    document.querySelector('section[aria-label="System safety status"]')?.innerText ?? '',
  values: [...document.querySelectorAll('section[aria-label] .tnum')]
    .filter((el) => parseFloat(getComputedStyle(el).fontSize) >= 30)
    .map((el) => el.textContent.trim()),
  /** Measurement panel labels encode the value, e.g. "Tubing tension 0.41 newtons". */
  labels: [...document.querySelectorAll('section[aria-label]')].map((el) =>
    el.getAttribute('aria-label'),
  ),
  text: document.body.innerText,
  staleNote: /last known readings, not live/i.test(document.body.innerText),
})

let mock = null
try {
  if (MODE === 'live') {
    mock = spawn(process.execPath, ['scripts/mock-esp32.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, MOCK_PORT: String(PORT) },
      stdio: 'ignore',
    })
    const ready = await waitForMock(`http://localhost:${PORT}/data`)
    if (!ready) throw new Error(`simulator did not start on :${PORT}`)
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--window-size=1920,1080', '--hide-scrollbars'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })
  const pageErrors = []
  const netErrors = []
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    const text = m.text()
    // A stopped device legitimately produces connection-refused logs in the
    // browser; those are expected and handled, not app errors.
    if (/ERR_|Failed to load resource/i.test(text)) netErrors.push(text)
    else pageErrors.push(text)
  })
  page.on('pageerror', (e) => pageErrors.push(String(e)))
  const assertNoErrors = () =>
    check('no uncaught console/page errors', pageErrors.length === 0, pageErrors.join(' | '))

  await page.goto(DASH, { waitUntil: 'networkidle2' })

  if (MODE === 'unconfigured') {
    await sleep(3000)
    const screen = await page.evaluate(readScreen)
    check(
      'status is NOT CONFIGURED',
      screen.status === 'NOT CONFIGURED',
      `status=${screen.status}`,
    )
    check(
      'no values are shown (all placeholders)',
      screen.values.length === 0 || screen.values.every((v) => v === '—'),
      `values=${screen.values.join(',')}`,
    )
    check(
      'no fabricated measurement is presented',
      !screen.labels.some((label) => /\d/.test(label ?? '')),
      `labels=${screen.labels.join(' | ')}`,
    )
    assertNoErrors()
  } else {
    await sleep(4500)
    const live = await page.evaluate(readScreen)
    check(
      'live status is NORMAL/WARNING/CRITICAL',
      ['NORMAL', 'WARNING', 'CRITICAL'].includes(live.status),
      `status=${live.status}`,
    )
    check(
      'live readings are shown',
      live.values.length > 0 && live.values.every((v) => v && v !== '—'),
      `values=${live.values.join(', ')}`,
    )

    // Kill the simulator and let the dashboard notice.
    mock.kill()
    mock = null
    await sleep(7000)

    const stale = await page.evaluate(readScreen)
    check(
      'status becomes DATA STALE after the device stops',
      stale.status === 'DATA STALE',
      `status=${stale.status}`,
    )
    check(
      'last known values are retained, not zeroed',
      JSON.stringify(stale.values) === JSON.stringify(live.values) &&
        stale.values.every((v) => v !== '—'),
      `live=[${live.values.join(', ')}] stale=[${stale.values.join(', ')}]`,
    )
    check('the stale-data warning is shown', stale.staleNote)
    check(
      'no fabricated 0.00 tension placeholder',
      !/Tubing tension[\s\S]{0,40}0\.00 N/.test(stale.text),
    )
    check(
      'only expected network logs after the device stops',
      netErrors.length > 0 && pageErrors.length === 0,
      `${netErrors.length} network log(s)`,
    )

    // Restart the simulator and confirm the dashboard recovers on its own.
    mock = spawn(process.execPath, ['scripts/mock-esp32.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, MOCK_PORT: String(PORT) },
      stdio: 'ignore',
    })
    const recoveredReady = await waitForMock(`http://localhost:${PORT}/data`)
    if (!recoveredReady) throw new Error(`simulator did not restart on :${PORT}`)
    await sleep(3500)
    const recovered = await page.evaluate(readScreen)
    check(
      'live readings resume automatically after the device returns',
      ['NORMAL', 'WARNING', 'CRITICAL'].includes(recovered.status) &&
        recovered.values.length > 0 &&
        recovered.values.every((v) => v && v !== '—'),
      `status=${recovered.status}`,
    )
    assertNoErrors()
  }

  await browser.close()
} finally {
  mock?.kill()
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed (mode=${MODE})`)
process.exit(failed.length ? 1 : 0)
