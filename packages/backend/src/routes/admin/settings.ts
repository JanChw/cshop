import { Hono } from 'hono'
import { db } from '../../db'
import { settings } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { success } from '../../utils/response'
import { validateJson } from '../../utils/validate'
import { z } from 'zod'
import { auth } from '../../middleware/auth'
import { requireStaff, requirePermission } from '../../middleware/permission'
import type { AppEnv } from '../../types/hono'

const DEFAULTS: Record<string, string> = {
  activity_retention_days: '30'
}

function ensureDefaults(): void {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    const [existing] = db.select().from(settings).where(eq(settings.key, key)).limit(1).all()
    if (!existing) {
      db.insert(settings).values({ key, value }).run()
    }
  }
}

const updateSchema = z.object({
  activity_retention_days: z.string().optional()
})

const app = new Hono<AppEnv>()
app.use('*', auth)
app.use('*', requireStaff)

app.get('/', requirePermission('settings.read'), async (c) => {
  ensureDefaults()
  const items = db.select().from(settings).all()
  const result: Record<string, string> = {}
  for (const item of items) {
    result[item.key] = item.value
  }
  return success(c, result)
})

app.put('/', requirePermission('settings.update'), validateJson(updateSchema), async (c) => {
  const data = c.req.valid('json')
  ensureDefaults()

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      db.insert(settings).values({ key, value: String(value) })
        .onConflictDoUpdate({ target: settings.key, set: { value: String(value) } })
        .run()
    }
  }

  const items = db.select().from(settings).all()
  const result: Record<string, string> = {}
  for (const item of items) {
    result[item.key] = item.value
  }
  return success(c, result)
})

export default app
