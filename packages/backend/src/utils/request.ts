// Shared request-parsing helpers used across paginated / search routes.
//
// Centralizing these eliminates ~15 copies of the same Math.max/Math.min +
// parseInt(NaN) pitfalls and the LIKE-escape regex drift.

import type { Context } from 'hono'

export interface Pagination {
  page: number
  limit: number
  offset: number
}

// Parse ?page & ?limit defensively: non-numeric or missing values fall back
// to defaults. `limit` is capped at 100 to protect list endpoints.
export function parsePagination(c: Context, opts?: { defaultLimit?: number; maxLimit?: number }): Pagination {
  const defaultLimit = opts?.defaultLimit ?? 20
  const maxLimit = opts?.maxLimit ?? 100

  const rawPage = parseInt(c.req.query('page') ?? '1')
  const rawLimit = parseInt(c.req.query('limit') ?? String(defaultLimit))

  const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1
  const limit = Number.isFinite(rawLimit) ? Math.min(maxLimit, Math.max(1, rawLimit)) : defaultLimit
  return { page, limit, offset: (page - 1) * limit }
}

// Escape the LIKE metacharacters (\, %, _) so user input is matched literally.
// Caller still wraps the result in `%...%` for substring search.
export function escapeLikePattern(s: string): string {
  return s.replace(/[\\%_]/g, ch => '\\' + ch)
}

// Extract the client IP from proxy headers, falling back to 'unknown'.
export function getClientIP(c: Context): string {
  const xff = c.req.header('X-Forwarded-For')
  if (xff) return xff.split(',')[0].trim()
  const real = c.req.header('X-Real-IP')
  if (real) return real
  return 'unknown'
}
