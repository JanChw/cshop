// Unified upload helpers.
//
// Centralizes: browser-declared MIME check, size cap, temp file lifecycle,
// magic-byte verification (do NOT trust `file.type`), and image dimension
// reading — so every upload endpoint follows the same security posture.

import { unlink } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import sharp from 'sharp'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { config } from '../config'
import { processImage, type ImageVariants } from './image'
import { verifyImageFile } from './imageMagic'

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const ALLOWED_STICKER_TYPES = ['image/png', 'image/webp']

// Error carrying an HTTP status. Upload handlers surface it directly.
export class UploadError extends Error {
  status: ContentfulStatusCode
  constructor(message: string, status: ContentfulStatusCode = 400) {
    super(message)
    this.status = status
  }
}

export interface AcceptedImage {
  tmpPath: string
  detectedMime: string
  variants: ImageVariants
  cleanup: () => Promise<void>
}

// Accept a generic image upload (jpg/png/webp). Writes to a temp file, verifies
// the real format from magic bytes, generates 4 webp variants. The caller is
// responsible for inserting DB rows (optionally inside a transaction) and
// invoking `cleanup()` in a finally block.
export async function acceptImageUpload(file: File, opts?: { maxBytes?: number }): Promise<AcceptedImage> {
  const maxBytes = opts?.maxBytes ?? config.uploadMaxBytes
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new UploadError('不支持的文件格式，仅支持 jpg/png/webp')
  }
  if (file.size > maxBytes) {
    throw new UploadError(`文件大小不能超过 ${Math.round(maxBytes / 1024 / 1024)}MB`)
  }

  const ext = file.name.split('.').pop() ?? 'bin'
  const tmpPath = `/tmp/cshop-upload-${randomUUID()}.${ext}`
  await Bun.write(tmpPath, file)

  const detected = await verifyImageFile(tmpPath)
  if (!detected) {
    await unlink(tmpPath).catch(() => {})
    throw new UploadError('文件内容与声明类型不符')
  }

  try {
    const variants = await processImage(tmpPath)
    return {
      tmpPath,
      detectedMime: detected,
      variants,
      cleanup: async () => { await unlink(tmpPath).catch(() => {}) }
    }
  } catch (err) {
    await unlink(tmpPath).catch(() => {})
    throw err
  }
}

export interface AcceptedSticker {
  filePath: string
  filename: string
  detectedMime: string
  width: number
  height: number
}

// Read width/height from an image file via sharp. Returns null on failure so
// the caller can decide on a fallback rather than silently storing fake dims.
export async function readImageSize(filePath: string): Promise<{ width: number; height: number } | null> {
  try {
    const meta = await sharp(filePath).metadata()
    if (meta.width && meta.height) return { width: meta.width, height: meta.height }
  } catch {
    // fall through
  }
  return null
}

// Accept a sticker upload (png/webp only — svg blocked for XSS risk). Writes
// directly to the sticker directory and reads dimensions. Returns the final
// file path + filename so the caller can store them in a single DB insert.
export async function acceptStickerUpload(file: File): Promise<AcceptedSticker> {
  if (!ALLOWED_STICKER_TYPES.includes(file.type)) {
    throw new UploadError('仅支持 png/webp 格式（svg 因 XSS 风险不再支持）')
  }
  if (file.size > config.stickerMaxBytes) {
    throw new UploadError(`文件大小不能超过 ${Math.round(config.stickerMaxBytes / 1024 / 1024)}MB`)
  }

  mkdirSync(config.stickerDir, { recursive: true })

  const ext = file.type === 'image/png' ? 'png' : 'webp'
  const filename = `sticker-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`
  const filePath = `${config.stickerDir}/${filename}`
  await Bun.write(filePath, file)

  const detected = await verifyImageFile(filePath)
  if (!detected) {
    await unlink(filePath).catch(() => {})
    throw new UploadError('文件内容与声明类型不符')
  }

  const size = await readImageSize(filePath)
  return {
    filePath,
    filename,
    detectedMime: detected,
    width: size?.width ?? 200,
    height: size?.height ?? 200
  }
}

// Convert an UploadError into a fail() response shape. Returns the args for
// the caller to spread into `fail(c, ...)`.
export function uploadErrorPayload(err: unknown): { message: string; status: ContentfulStatusCode } {
  if (err instanceof UploadError) return { message: err.message, status: err.status }
  // Unexpected — log and hide internals.
  console.error('[upload] unexpected error:', err)
  return { message: '上传失败,请联系管理员', status: 500 }
}
