// Reject any filename that could escape the storage directory.
// Allowed: ASCII letters, digits, dot, underscore, hyphen.
// Reject leading dot to avoid hidden files.
const SAFE_FILENAME_RE = /^[A-Za-z0-9_-][A-Za-z0-9._-]{0,254}$/

export function isSafeFilename(name: string): boolean {
  if (typeof name !== 'string') return false
  if (name.length === 0) return false
  if (name.includes('/') || name.includes('\\')) return false
  if (name.includes('\0')) return false
  if (name === '.' || name === '..') return false
  return SAFE_FILENAME_RE.test(name)
}
