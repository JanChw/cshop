import { Hono } from 'hono'
import { db } from '../db'
import { userAddresses } from '../db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { auth } from '../middleware/auth'
import { success, fail } from '../utils/response'
import { z } from 'zod'
import { validateJson } from '../utils/validate'
import type { AppEnv } from '../types/hono'

const app = new Hono<AppEnv>()
app.use('*', auth)

const addressSchema = z.object({
  name: z.string().min(1, '收件人不能为空'),
  phone: z.string().min(1, '手机号不能为空'),
  province: z.string().min(1, '省份不能为空'),
  city: z.string().min(1, '城市不能为空'),
  district: z.string().min(1, '区/县不能为空'),
  detail: z.string().min(1, '详细地址不能为空'),
  isDefault: z.boolean().optional()
})

const addressUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  province: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  district: z.string().min(1).optional(),
  detail: z.string().min(1).optional(),
  isDefault: z.boolean().optional()
}).refine(d => Object.keys(d).length > 0, '至少修改一个字段')

app.get('/', async (c) => {
  const userId = c.get('userId')!
  const items = await db
    .select()
    .from(userAddresses)
    .where(eq(userAddresses.userId, userId))
    .orderBy(sql`${userAddresses.isDefault} DESC, ${userAddresses.createdAt} DESC`)
  return success(c, items)
})

app.get('/:id', async (c) => {
  const userId = c.get('userId')!
  const id = parseInt(c.req.param('id'))
  const [item] = await db
    .select()
    .from(userAddresses)
    .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)))
    .limit(1)
  if (!item) return fail(c, '地址不存在', 404)
  return success(c, item)
})

app.post('/', validateJson(addressSchema), async (c) => {
  const userId = c.get('userId')!
  const data = c.req.valid('json')

  if (data.isDefault) {
    await db.update(userAddresses)
      .set({ isDefault: false })
      .where(eq(userAddresses.userId, userId))
      .run()
  }

  const [created] = await db
    .insert(userAddresses)
    .values({ userId, ...data, isDefault: data.isDefault ?? false })
    .returning()
    .all()
  return success(c, created, 201)
})

app.put('/:id', validateJson(addressUpdateSchema), async (c) => {
  const userId = c.get('userId')!
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const [existing] = await db
    .select()
    .from(userAddresses)
    .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)))
    .limit(1)
  if (!existing) return fail(c, '地址不存在', 404)

  if (data.isDefault) {
    await db.update(userAddresses)
      .set({ isDefault: false })
      .where(eq(userAddresses.userId, userId))
      .run()
  }

  await db.update(userAddresses)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)))
    .run()

  const [updated] = await db
    .select()
    .from(userAddresses)
    .where(eq(userAddresses.id, id))
    .limit(1)
  return success(c, updated)
})

app.delete('/:id', async (c) => {
  const userId = c.get('userId')!
  const id = parseInt(c.req.param('id'))

  const [existing] = await db
    .select()
    .from(userAddresses)
    .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)))
    .limit(1)
  if (!existing) return fail(c, '地址不存在', 404)

  await db.delete(userAddresses)
    .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)))
    .run()
  return success(c, { id })
})

app.post('/default/:id', async (c) => {
  const userId = c.get('userId')!
  const id = parseInt(c.req.param('id'))

  const [existing] = await db
    .select()
    .from(userAddresses)
    .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)))
    .limit(1)
  if (!existing) return fail(c, '地址不存在', 404)

  await db.update(userAddresses)
    .set({ isDefault: false })
    .where(eq(userAddresses.userId, userId))
    .run()
  await db.update(userAddresses)
    .set({ isDefault: true, updatedAt: new Date().toISOString() })
    .where(eq(userAddresses.id, id))
    .run()
  return success(c, { id, isDefault: true })
})

export default app
