import sharp from 'sharp'
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { config } from '../config'

const SIZES = [
  { suffix: 'thumb', width: 400 },
  { suffix: 'small', width: 600 },
  { suffix: 'medium', width: 1000 },
  { suffix: 'large', width: 2000 }
] as const

export interface ImageVariants {
  baseName: string
  thumb: { path: string; size: number; width: number; height: number }
  small: { path: string; size: number; width: number; height: number }
  medium: { path: string; size: number; width: number; height: number }
  large: { path: string; size: number; width: number; height: number }
}

const BG_SAMPLE_SIZE = 5
const BG_THRESHOLD = 30
const BG_FEATHER = 10
const ALPHA_THRESHOLD = 50

interface CornerSample {
  hasOpaqueBg: boolean
  bgColor: [number, number, number]
}

async function sampleCorners(inputPath: string): Promise<CornerSample> {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const size = Math.min(BG_SAMPLE_SIZE, Math.min(width, height))
  let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0

  const addPixel = (x: number, y: number) => {
    const idx = (y * width + x) * channels
    rSum += data[idx]
    gSum += data[idx + 1]
    bSum += data[idx + 2]
    aSum += data[idx + 3]
    count++
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) addPixel(x, y)
    for (let x = width - size; x < width; x++) addPixel(x, y)
  }
  for (let y = height - size; y < height; y++) {
    for (let x = 0; x < size; x++) addPixel(x, y)
    for (let x = width - size; x < width; x++) addPixel(x, y)
  }

  const avgAlpha = aSum / count
  return {
    hasOpaqueBg: avgAlpha > ALPHA_THRESHOLD,
    bgColor: [Math.round(rSum / count), Math.round(gSum / count), Math.round(bSum / count)]
  }
}

export async function removeBackground(inputPath: string): Promise<string | null> {
  const { hasOpaqueBg, bgColor } = await sampleCorners(inputPath)
  if (!hasOpaqueBg) return null

  const outPath = inputPath.replace(/\.\w+$/, '-nobg.png')
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const [bgR, bgG, bgB] = bgColor

  for (let i = 0; i < data.length; i += channels) {
    const dr = data[i] - bgR
    const dg = data[i + 1] - bgG
    const db = data[i + 2] - bgB
    const dist = Math.sqrt(dr * dr + dg * dg + db * db)

    if (dist < BG_THRESHOLD) {
      data[i + 3] = 0
    } else if (dist < BG_THRESHOLD + BG_FEATHER) {
      data[i + 3] = Math.round(255 * (dist - BG_THRESHOLD) / BG_FEATHER)
    }
  }

  await sharp(data, { raw: { width, height, channels } }).png().toFile(outPath)
  return outPath
}

export async function generateMask(inputPath: string): Promise<string> {
  const outPath = inputPath.replace(/\.\w+$/, '-mask.png')
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info

  for (let i = 0; i < data.length; i += channels) {
    if (data[i + 3] > 30) {
      data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255
    } else {
      data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 0
    }
  }

  await sharp(data, { raw: { width, height, channels } }).png().toFile(outPath)
  return outPath
}

export async function processImage(inputPath: string): Promise<ImageVariants> {
  mkdirSync(config.uploadDir, { recursive: true })

  const baseName = randomUUID()
  const metadata = await sharp(inputPath).metadata()
  const originalWidth = metadata.width ?? 2000
  const originalHeight = metadata.height ?? 2000

  const result: Record<string, { path: string; size: number; width: number; height: number }> = {}

  for (const { suffix, width } of SIZES) {
    const filename = `${baseName}-${suffix}.webp`
    const filepath = `${config.uploadDir}/${filename}`
    const ratio = Math.min(width / originalWidth, 1)
    const targetWidth = Math.round(originalWidth * ratio)
    const targetHeight = Math.round(originalHeight * ratio)

    await sharp(inputPath)
      .resize(targetWidth, targetHeight, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath)

    const file = Bun.file(filepath)
    result[suffix] = {
      path: filename,
      size: file.size,
      width: targetWidth,
      height: targetHeight
    }
  }

  return {
    baseName,
    thumb: result.thumb,
    small: result.small,
    medium: result.medium,
    large: result.large
  }
}
