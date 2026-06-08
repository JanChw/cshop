import { zValidator } from '@hono/zod-validator'
import type { z } from 'zod'

// Wraps @hono/zod-validator with the project's standard error envelope.
// Use the result with `c.req.valid('json')` inside the route handler.
export function validateJson<T extends z.ZodTypeAny>(schema: T) {
  return zValidator('json', schema, (result, c) => {
    if (!result.success) {
      return c.json({
        success: false,
        data: null,
        error: result.error.errors.map(e => `${e.path.join('.') || 'body'}: ${e.message}`).join('; ')
      }, 400)
    }
  })
}
