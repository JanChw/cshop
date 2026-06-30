import { Hono } from 'hono'
import { db } from '../../db'
import { settings } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { success, fail } from '../../utils/response'
import { validateJson } from '../../utils/validate'
import { invalidate, getSetting } from '../../utils/settings'
import { sendTestEmail } from '../../utils/notify'
import { z } from 'zod'
import { auth } from '../../middleware/auth'
import { requireStaff, requirePermission } from '../../middleware/permission'
import type { AppEnv } from '../../types/hono'

const DEFAULTS: Record<string, string> = {
  trash_retention_days: '30',
  activity_events_retention_days: '30',
  site_name: 'CShop 电商平台',
  contact_email: 'admin@cshop.com',
  login_lock: 'true',
  login_max_attempts: '3',
  login_lock_minutes: '30',
  session_timeout: '15',
  refresh_token_ttl: '7',
  ip_whitelist: 'false',
  min_password_length: '8',
  notify_new_order: 'true',
  notify_stock_alert: 'true',
  notify_user_register: 'false',
  notify_email: 'true',
  notify_sms: 'false',
  notify_receive_email: 'admin@cshop.com',
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
  trash_retention_days: z.string().optional(),
  activity_events_retention_days: z.string().optional(),
  site_name: z.string().optional(),
  contact_email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  login_lock: z.string().optional(),
  login_max_attempts: z.string().optional(),
  login_lock_minutes: z.string().optional(),
  session_timeout: z.string().optional(),
  refresh_token_ttl: z.string().optional(),
  ip_whitelist: z.string().optional(),
  min_password_length: z.string().optional(),
  notify_new_order: z.string().optional(),
  notify_stock_alert: z.string().optional(),
  notify_user_register: z.string().optional(),
  notify_email: z.string().optional(),
  notify_sms: z.string().optional(),
  notify_receive_email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
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
      invalidate(key)
    }
  }

  const items = db.select().from(settings).all()
  const result: Record<string, string> = {}
  for (const item of items) {
    result[item.key] = item.value
  }
  return success(c, result)
})

app.post('/test-email', requirePermission('settings.test_email'), async (c) => {
  const to = getSetting('notify_receive_email', 'admin@cshop.com')
  const result = await sendTestEmail(to)
  if (!result.ok) {
    return fail(c, result.reason ?? '邮件发送失败', 500)
  }
  return success(c, { sent: true, to })
})

export default app
