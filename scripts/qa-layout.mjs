/**
 * DEVELOPMENT-ONLY layout audit
 * -----------------------------
 * Reports geometry problems that are hard to eyeball: page overflow, clipped
 * panels, and the rendered size of the primary read-outs.
 *
 *   node scripts/qa-layout.mjs            # audit at 1920×1080 and 1366×768
 */
import puppeteer from 'puppeteer-core'

const URL = process.env.DASH_URL ?? 'http://localhost:5173'
const CHROME =
  process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--window-size=1920,1080', '--hide-scrollbars'],
})
const page = await browser.newPage()
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

for (const [width, height] of [
  [2560, 1440],
  [1920, 1080],
  [1600, 900],
  [1366, 768],
  [1280, 720],
  [1024, 600],
]) {
  await page.setViewport({ width, height })
  await page.goto(URL, { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 5000))

  const report = await page.evaluate(() => {
    const rect = (el) => {
      const r = el.getBoundingClientRect()
      return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), left: Math.round(r.left) }
    }
    // Overflow is only meaningful on block-level boxes; inline boxes report
    // clientWidth/clientHeight as 0 and are false positives.
    const clipped = []
    for (const el of document.querySelectorAll('p, h1, h2, h3, span, dd, li')) {
      const style = getComputedStyle(el)
      if (style.display.startsWith('inline') && style.display !== 'inline-block') continue
      if (style.overflow === 'hidden' || style.textOverflow === 'ellipsis') continue
      if (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) {
        clipped.push({ text: (el.textContent ?? '').trim().slice(0, 60), ...rect(el) })
      }
    }
    // Any descendant that spills outside its owning panel is a real clip risk.
    const spills = []
    for (const section of document.querySelectorAll('section[aria-label]')) {
      const sr = section.getBoundingClientRect()
      for (const el of section.querySelectorAll('*')) {
        if (el === section) continue
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        const overRight = Math.round(r.right - sr.right)
        const overBottom = Math.round(r.bottom - sr.bottom)
        if (overRight > 2 || overBottom > 2) {
          spills.push({
            panel: section.getAttribute('aria-label'),
            text: (el.textContent ?? '').trim().slice(0, 40),
            tag: el.tagName.toLowerCase(),
            overRight,
            overBottom,
          })
        }
      }
    }
    const bigValues = [...document.querySelectorAll('section[aria-label] .tnum')]
      .slice(0, 8)
      .map((el) => ({
        text: (el.textContent ?? '').trim().slice(0, 24),
        fontPx: Math.round(parseFloat(getComputedStyle(el).fontSize)),
        ...rect(el),
      }))
    const sections = [...document.querySelectorAll('section[aria-label]')].map((el) => ({
      label: el.getAttribute('aria-label'),
      ...rect(el),
    }))
    const svg = document.querySelector('section[aria-label*="Trend"] svg')
    const stage = document.querySelector('[data-stage]')
    const stageRect = stage ? stage.getBoundingClientRect() : null
    const ol = document.querySelector('section[aria-label="Recent events"] ol')
    const list = ol
      ? {
          h: Math.round(ol.getBoundingClientRect().height),
          rows: [...ol.children].map((li) => ({
            h: Math.round(li.getBoundingClientRect().height),
            text: (li.textContent ?? '').trim().slice(0, 30),
          })),
        }
      : null
    return {
      title: document.querySelector('h1')?.textContent,
      status: document.querySelector('section[aria-label="System safety status"] h2')?.textContent,
      doc: {
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      },
      sections,
      bigValues,
      trendSvg: svg ? rect(svg) : null,
      stage: stageRect
        ? {
            w: Math.round(stageRect.width),
            h: Math.round(stageRect.height),
            left: Math.round(stageRect.left),
            top: Math.round(stageRect.top),
            transform: getComputedStyle(stage).transform,
          }
        : null,
      list,
      clipped,
      spills,
      text: document.body.innerText,
    }
  })

  console.log(`\n================ ${width}×${height} ================`)
  console.log('title:', report.title, '| status:', report.status)
  console.log('document:', JSON.stringify(report.doc))
  console.log('stage:', JSON.stringify(report.stage))
  const fits =
    report.stage &&
    report.stage.w <= width + 2 &&
    report.stage.h <= height + 2 &&
    report.doc.scrollHeight <= report.doc.clientHeight + 1 &&
    report.doc.scrollWidth <= report.doc.clientWidth + 1
  console.log(fits ? 'FIT: entire dashboard visible, no scroll' : 'OVERFLOW: dashboard does not fit')
  console.log('sections:')
  for (const s of report.sections) console.log('  ', JSON.stringify(s))
  console.log('primary read-outs:')
  for (const v of report.bigValues) console.log('  ', JSON.stringify(v))
  console.log('trend svg:', JSON.stringify(report.trendSvg))
  console.log('events list:', JSON.stringify(report.list))
  console.log('clipped text elements:', report.clipped.length)
  for (const c of report.clipped.slice(0, 12)) console.log('   !', JSON.stringify(c))
  console.log('descendants spilling outside a panel:', report.spills.length)
  for (const s of report.spills.slice(0, 12)) console.log('   >', JSON.stringify(s))
}

console.log('\nconsole errors:', errors.length ? errors.join(' | ') : 'none')
await browser.close()