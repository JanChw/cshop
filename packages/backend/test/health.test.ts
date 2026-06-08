import { test, expect } from 'bun:test'
import './helpers/setup'
import { api } from './helpers/request'

test('GET /api/v1/health returns ok', async () => {
  const { status, body } = await api('/api/v1/health')
  expect(status).toBe(200)
  expect(body).toEqual({ success: true, data: { status: 'ok' }, error: null })
})
