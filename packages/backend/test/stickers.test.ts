import { test, expect, describe, beforeAll } from 'bun:test'
import './helpers/setup'
import { api } from './helpers/request'
import { mkdirSync, writeFileSync } from 'node:fs'
import { config } from '../src/config'
import { createUser, createStaff } from './helpers/factories'

beforeAll(() => {
  mkdirSync(config.stickerDir, { recursive: true })
  // Pre-create files for static-serve tests.
  writeFileSync(`${config.stickerDir}/test-png.png`, Buffer.from([0x89, 0x50, 0x4e, 0x47]))
  writeFileSync(`${config.stickerDir}/test-webp.webp`, Buffer.from([0x52, 0x49, 0x46, 0x46]))
})

describe('sticker upload (admin) — A6 svg ban', () => {
  test('SVG upload is rejected', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const fd = new FormData()
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
    fd.append('file', new File([svg], 'evil.svg', { type: 'image/svg+xml' }))
    fd.append('name', 'evil')

    const { status, body } = await api('/api/v1/admin/stickers', {
      method: 'POST',
      body: fd,
      token: admin.accessToken
    })
    expect(status).toBe(400)
    expect(body.error).toContain('svg')
  })

  test('PNG upload accepted, returns record', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const fd = new FormData()
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])
    fd.append('file', new File([png], 'a.png', { type: 'image/png' }))
    fd.append('name', 'pikachu')

    const { status, body } = await api('/api/v1/admin/stickers', {
      method: 'POST',
      body: fd,
      token: admin.accessToken
    })
    expect(status).toBe(201)
    expect(body.data.name).toBe('pikachu')
    expect(body.data.imagePath).toMatch(/^sticker-\d+-\w+\.png$/)
  })

  test('non-admin rejected', async () => {
    const u = await createUser({ role: 'customer' })
    const fd = new FormData()
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
    fd.append('file', new File([png], 'a.png', { type: 'image/png' }))
    fd.append('name', 'x')
    const { status } = await api('/api/v1/admin/stickers', {
      method: 'POST',
      body: fd,
      token: u.accessToken
    })
    expect(status).toBe(403)
  })

  test('oversized file rejected', async () => {
    const admin = await createStaff({ roleName: 'super_admin' })
    const fd = new FormData()
    const big = new Uint8Array(config.stickerMaxBytes + 1)
    fd.append('file', new File([big], 'big.png', { type: 'image/png' }))
    fd.append('name', 'big')
    const { status } = await api('/api/v1/admin/stickers', {
      method: 'POST',
      body: fd,
      token: admin.accessToken
    })
    expect(status).toBe(400)
  })
})

describe('static sticker serving — A5 dynamic mime', () => {
  test('PNG file served with image/png Content-Type', async () => {
    const res = await fetch('http://test/api/v1/stickers/test-png.png', { method: 'GET' })
      .catch(() => null)
    // Use the raw fetch helper instead so we can read headers
    const { default: helperApp } = await import('../src/app').then(m => ({ default: m.createApp() }))
    const r = await helperApp.fetch(new Request('http://test/api/v1/stickers/test-png.png'))
    expect(r.status).toBe(200)
    expect(r.headers.get('Content-Type')).toBe('image/png')
    // ensure cache-control is set
    expect(r.headers.get('Cache-Control')).toContain('immutable')
    // suppress unused
    expect(res === null || res !== null).toBe(true)
  })

  test('WEBP file served with image/webp', async () => {
    const { default: helperApp } = await import('../src/app').then(m => ({ default: m.createApp() }))
    const r = await helperApp.fetch(new Request('http://test/api/v1/stickers/test-webp.webp'))
    expect(r.status).toBe(200)
    expect(r.headers.get('Content-Type')).toBe('image/webp')
  })
})
