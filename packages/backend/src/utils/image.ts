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
