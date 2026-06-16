// Manual verification script for the design page t-shirt color change.
// Requires playwright to be available in NODE_PATH, e.g.:
//   NODE_PATH=/home/ubuntu/.local/node/lib/node_modules node scripts/verify-design-color.mjs
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321/design'
const SHOTS_DIR = process.env.SHOTS_DIR || '/tmp/cshop-shots'

const tests = [
  { name: '珍珠白', hex: '#ffffff', expected: [229, 225, 218] },
  { name: '极简黑', hex: '#1a1a1a', expected: [24, 23, 23] },
  { name: '麻灰色', hex: '#b5b5b5', expected: [162, 160, 155] },
  { name: '撒哈拉金', hex: '#c2652a', expected: [174, 89, 36] },
  { name: '森林绿', hex: '#2d4a3e', expected: [41, 66, 53] },
  { name: '酒红色', hex: '#8c3c3c', expected: [126, 53, 52] }
]

function withinTolerance(actual, expected, tolerance = 8) {
  return actual.every((v, i) => Math.abs(v - expected[i]) <= tolerance)
}

async function main() {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || '/home/ubuntu/.local/node/lib/node_modules/playwright/node_modules/playwright-core/.local-browsers/chromium-1223/chrome-linux64/chrome'
  const browser = await chromium.launch({ headless: true, executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  const ctx = await browser.newContext({ viewport: { width: 414, height: 896 } })
  const page = await ctx.newPage()

  const errors = []
  page.on('pageerror', e => errors.push('[pageerror] ' + e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push('[console.error] ' + m.text()) })

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('canvas', { timeout: 5000 })
  await page.waitForTimeout(3000)

  let allPassed = true
  const results = []

  for (const t of tests) {
    const swatch = page.locator(`span:text-is("${t.name}")`).first()
    await swatch.click()
    await page.waitForTimeout(1500)

    const samples = await page.evaluate(() => {
      const c = document.querySelector('canvas')
      if (!c) return null
      const ctx = c.getContext('2d')
      if (!ctx) return null
      const w = c.width
      const h = c.height
      const grab = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data)
      return {
        center: grab(Math.floor(w / 2), Math.floor(h / 2)).slice(0, 3),
        bg: grab(10, 10).slice(0, 3)
      }
    })

    const passed = samples && withinTolerance(samples.center, t.expected)
    if (!passed) allPassed = false
    results.push({ name: t.name, samples, expected: t.expected, passed })
  }

  const baseBg = results[0]?.samples?.bg
  for (const r of results) {
    const center = r.samples?.center ? `rgb(${r.samples.center.join(',')})` : 'null'
    const bg = r.samples?.bg ? `rgb(${r.samples.bg.join(',')})` : 'null'
    const expected = `rgb(${r.expected.join(',')})`
    const bgChanged = baseBg && r.samples?.bg && !withinTolerance(r.samples.bg, baseBg, 2)
    if (bgChanged) allPassed = false
    console.log(`${r.passed && !bgChanged ? '✓' : '✗'} ${r.name.padEnd(8)} tshirt=${center.padEnd(18)} expected=${expected}  bg=${bg}`)
  }

  if (errors.length) {
    console.log('\nErrors:')
    for (const e of errors) console.log(' -', e)
  }

  await browser.close()
  process.exit(allPassed ? 0 : 1)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
