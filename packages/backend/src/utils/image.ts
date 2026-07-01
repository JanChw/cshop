import sharp from 'sharp'
import { randomUUID } from 'node:crypto'
import { mkdirSync, existsSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import { config } from '../config'

const execFileAsync = promisify(execFile)

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

const MASK_ALPHA_THRESHOLD = 30

// Bucket files by the first two chars of baseName so a flat uploads/ dir
// doesn't grow into hundreds of thousands of entries (readdir / lazyClean
// stay cheap). Returned path is relative to uploadDir and includes the
// bucket prefix, e.g. "ab/abcdef-thumb.webp".
export function bucketForBaseName(baseName: string): string {
  return baseName.slice(0, 2)
}

export async function removeBackground(inputPath: string): Promise<string | null> {
  const outPath = inputPath.replace(/\.\w+$/, '-nobg.png')
  const scriptPath = '/tmp/cshop-rembg-' + Date.now() + '.py'
  const script = `import sys
from rembg import remove
with open(sys.argv[1], 'rb') as f:
    inp = f.read()
out = remove(inp)
with open(sys.argv[2], 'wb') as f:
    f.write(out)
`
  await writeFile(scriptPath, script)
  try {
    await execFileAsync('python3', [scriptPath, inputPath, outPath], { timeout: 60000 })
    return existsSync(outPath) ? outPath : null
  } finally {
    await unlink(scriptPath).catch(() => {})
  }
}

export async function generateMask(inputPath: string): Promise<string> {
  const outPath = inputPath.replace(/\.\w+$/, '-mask.png')
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info

  for (let i = 0; i < data.length; i += channels) {
    if (data[i + 3] > MASK_ALPHA_THRESHOLD) {
      data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255
    } else {
      data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 0
    }
  }

  await sharp(data, { raw: { width, height, channels } }).png().toFile(outPath)
  return outPath
}

export async function flattenOnWhite(inputPath: string): Promise<string> {
  const outPath = inputPath.replace(/\.\w+$/, '-flat.png')
  await sharp(inputPath)
    .flatten({ background: '#ffffff' })
    .png()
    .toFile(outPath)
  return outPath
}

export async function processImage(inputPath: string): Promise<ImageVariants> {
  mkdirSync(config.uploadDir, { recursive: true })

  const baseName = randomUUID()
  const bucket = bucketForBaseName(baseName)
  const bucketDir = `${config.uploadDir}/${bucket}`
  mkdirSync(bucketDir, { recursive: true })

  const metadata = await sharp(inputPath).metadata()
  const originalWidth = metadata.width ?? 2000
  const originalHeight = metadata.height ?? 2000

  const result: Record<string, { path: string; size: number; width: number; height: number }> = {}

  for (const { suffix, width } of SIZES) {
    const filename = `${baseName}-${suffix}.webp`
    const filepath = `${bucketDir}/${filename}`
    const ratio = Math.min(width / originalWidth, 1)
    const targetWidth = Math.round(originalWidth * ratio)
    const targetHeight = Math.round(originalHeight * ratio)

    await sharp(inputPath)
      .resize(targetWidth, targetHeight, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath)

    const file = Bun.file(filepath)
    result[suffix] = {
      path: `${bucket}/${filename}`,
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
