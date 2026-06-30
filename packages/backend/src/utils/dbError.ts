// Map low-level database / driver errors to HTTP-friendly responses.
//
// SQLite constraint violations carry a recognizable message substring (the
// bun:sqlite driver surfaces them via `err.message` / `err.code`). We never
// forward the raw message to the client — we return a stable code the API
// contract can rely on, and log the original server-side.

import type { ContentfulStatusCode } from 'hono/utils/http-status'

export interface DbErrorMapping {
  status: ContentfulStatusCode
  message: string
  // Hint for the caller to refine the message (e.g. "which constraint").
  kind: 'unique' | 'foreign_key' | 'not_null' | 'check' | 'unknown'
}

const UNIQUE_RE = /UNIQUE constraint/i
const FK_RE = /FOREIGN KEY constraint/i
const NOTNULL_RE = /NOT NULL constraint/i
const CHECK_RE = /CHECK constraint/i

export function mapDbError(err: unknown): DbErrorMapping {
  const msg = (err as Error | undefined)?.message ?? ''
  const code = (err as { code?: string } | undefined)?.code ?? ''

  if (UNIQUE_RE.test(msg) || code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return { status: 409, message: '数据已存在(唯一约束冲突)', kind: 'unique' }
  }
  if (FK_RE.test(msg) || code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || code === 'SQLITE_CONSTRAINT_FOREIGN_KEY') {
    return { status: 400, message: '关联数据不存在或冲突(外键约束)', kind: 'foreign_key' }
  }
  if (NOTNULL_RE.test(msg) || code === 'SQLITE_CONSTRAINT_NOTNULL') {
    return { status: 400, message: '必填字段缺失', kind: 'not_null' }
  }
  if (CHECK_RE.test(msg) || code === 'SQLITE_CONSTRAINT_CHECK') {
    return { status: 400, message: '数据不满足校验规则', kind: 'check' }
  }

  console.error('[db] unhandled error:', err)
  return { status: 500, message: '数据库操作失败,请联系管理员', kind: 'unknown' }
}
