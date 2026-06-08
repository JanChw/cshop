import { test, expect, describe, beforeAll } from 'bun:test'
import './helpers/setup'
import { api } from './helpers/request'
import { mkdirSync, writeFileSync } from 'node:fs'
import { config } from '../src/config'
import { isSafeFilename } from '../src/utils/safePath'

beforeAll(() => {
  // Make sure the upload dir exists with a known file we can probe for.
  mkdirSync(config.uploadDir, { recursive: true })
  writeFileSync(`${config.uploadDir}/legitimate.webp`, Buffer.from([0x52, 0x49, 0x46, 0x46]))
})

describe('path traversal protection (A4)', () => {
  // Each entry must NOT be allowed to read anything sensitive.
  const evilNames = [
    '..%2Fcshop.db',
    '..%5Ccshop.db',
    '%2E%2E%2Fcshop.db',
    '../../etc/passwd',
    'subdir/file.webp',
    '\\..\\cshop.db',
    'file\x00.webp',
    '.', '..',
    'CON', // not strictly traversal but bad
    '/absolute/path',
    'sub/file'
  ]

  for (const name of evilNames) {
    test(`rejects upload filename: ${JSON.stringify(name)}`, async () => {
      const { status } = await api(`/api/v1/uploads/${name}`)
      // Any non-200 is safe — file was not served.
      // (400 = bad name, 404 = not found, 401 = caught by adjacent auth, etc.)
      expect(status).not.toBe(200)
    })

    test(`rejects sticker filename: ${JSON.stringify(name)}`, async () => {
      const { status } = await api(`/api/v1/stickers/${name}`)
      expect(status).not.toBe(200)
    })
  }

  test('legitimate file still serves', async () => {
    const { status } = await api('/api/v1/uploads/legitimate.webp')
    expect(status).toBe(200)
  })
})

describe('isSafeFilename', () => {
  test('accepts normal names', () => {
    expect(isSafeFilename('foo.webp')).toBe(true)
    expect(isSafeFilename('a-b_c.123.png')).toBe(true)
    expect(isSafeFilename('uuid-thumb.webp')).toBe(true)
  })

  test('rejects path separators', () => {
    expect(isSafeFilename('../foo')).toBe(false)
    expect(isSafeFilename('a/b')).toBe(false)
    expect(isSafeFilename('a\\b')).toBe(false)
  })

  test('rejects empty / dot / dotdot', () => {
    expect(isSafeFilename('')).toBe(false)
    expect(isSafeFilename('.')).toBe(false)
    expect(isSafeFilename('..')).toBe(false)
  })

  test('rejects null bytes', () => {
    expect(isSafeFilename('a\x00.webp')).toBe(false)
  })

  test('rejects leading dot', () => {
    expect(isSafeFilename('.htaccess')).toBe(false)
  })
})
