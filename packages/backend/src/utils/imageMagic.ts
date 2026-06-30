// Magic bytes detection for uploaded images.
//
// `file.type` (the browser-supplied Content-Type) is trivially spoofable, so
// we verify the actual file header before accepting an upload. We accept the
// three formats supported by the image pipeline: JPEG, PNG, WEBP.

const SIGNATURES: Array<{ mime: string; bytes: number[] }> = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] } // 'RIFF' — webp container
]

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function isAllowedImageMime(mime: string): boolean {
  return ALLOWED.has(mime)
}

// Detect the real image format from the leading bytes of the file.
// Returns the canonical mime when matched, otherwise null.
export function detectImageMime(header: Uint8Array): string | null {
  for (const sig of SIGNATURES) {
    if (header.length < sig.bytes.length) continue
    let ok = true
    for (let i = 0; i < sig.bytes.length; i++) {
      if (header[i] !== sig.bytes[i]) { ok = false; break }
    }
    if (ok) {
      // WEBP needs the 'WEBP' FourCC at offset 8 too.
      if (sig.mime === 'image/webp') {
        if (header.length < 12) return null
        const fourcc = String.fromCharCode(header[8], header[9], header[10], header[11])
        if (fourcc !== 'WEBP') return null
      }
      return sig.mime
    }
  }
  return null
}

// Read the first N bytes of a File/BunFile for signature inspection.
export async function readHeader(filePath: string, n = 16): Promise<Uint8Array> {
  const buf = new Uint8Array(n)
  const file = Bun.file(filePath)
  const reader = file.stream().getReader()
  const { value } = await reader.read()
  await reader.cancel().catch(() => {})
  if (!value) return buf
  buf.set(value.subarray(0, n))
  return buf
}

// Validate that a saved file at `filePath` actually is one of the allowed
// image types, by checking magic bytes. Returns the detected mime or null.
export async function verifyImageFile(filePath: string): Promise<string | null> {
  const header = await readHeader(filePath)
  const detected = detectImageMime(header)
  if (!detected) return null
  return detected
}
