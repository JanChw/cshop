// One-time script: generate tshirt-mask.png from tshirt.png.
//
// Output is a white RGBA mask where bright regions (the t-shirt fabric) are
// rgb(255,255,255) with alpha=255, and dark regions (background / shadows we
// don't want to tint) are alpha=0. This mask is designed to be used as a
// multiply color layer on top of the original tshirt.png in fabric.js.
//
// Usage:
//   node scripts/generate-tshirt-mask.mjs [input] [output] [threshold]
// Defaults:
//   input     = packages/frontend/public/tshirt.png
//   output    = packages/frontend/public/tshirt-mask.png
//   threshold = 170 (avg RGB >= threshold -> white/alpha=255, else alpha=0)

import sharp from '/home/ubuntu/workspace/cshop/packages/backend/node_modules/sharp/lib/index.js'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')
const input = process.argv[2] || resolve(repoRoot, 'packages/frontend/public/tshirt.png')
const output = process.argv[3] || resolve(repoRoot, 'packages/frontend/public/tshirt-mask.png')
const threshold = Number(process.argv[4] || 170)

const meta = await sharp(input).metadata()
console.log(`Input: ${input} (${meta.width}x${meta.height})`)
console.log(`Threshold: ${threshold} (avg RGB >= ${threshold} -> white mask, else transparent)`)

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const w = info.width
const h = info.height
const total = w * h
const out = Buffer.alloc(w * h * 4)

let foreground = 0
let background = 0
const hist = new Map()
for (let i = 0, j = 0; i < data.length; i += 4, j += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2]
  const avg = (r + g + b) / 3
  const bucket = Math.floor(avg / 10) * 10
  hist.set(bucket, (hist.get(bucket) || 0) + 1)
  if (avg >= threshold) {
    out[j] = 255
    out[j + 1] = 255
    out[j + 2] = 255
    out[j + 3] = 255
    foreground++
  } else {
    out[j] = 0
    out[j + 1] = 0
    out[j + 2] = 0
    out[j + 3] = 0
    background++
  }
}

console.log(`Foreground (mask): ${foreground} (${(foreground / total * 100).toFixed(1)}%)`)
console.log(`Background (transparent): ${background} (${(background / total * 100).toFixed(1)}%)`)

const sortedBuckets = [...hist.entries()].sort((a, b) => a[0] - b[0])
console.log('Avg-RGB histogram:')
for (const [bucket, count] of sortedBuckets) {
  const bar = '█'.repeat(Math.min(50, Math.round(count / total * 200)))
  console.log(`  ${String(bucket).padStart(3)}: ${String(count).padStart(7)} ${bar}`)
}

await sharp(out, { raw: { width: w, height: h, channels: 4 } })
  .png()
  .toFile(output)
const outMeta = await sharp(output).metadata()
console.log(`Output: ${output} (${outMeta.size} bytes)`)
