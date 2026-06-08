import { Hono } from 'hono'
import { db } from '../db'
import { cartItems, products, productVariants } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '../middleware/auth'
import { success, fail } from '../utils/response'
import { validateJson } from '../utils/validate'
import { cartSchema, cartUpdateSchema } from '../validators'
import { trackBusinessEvent } from '../utils/track'
import type { AppEnv } from '../types/hono'

const app = new Hono<AppEnv>()
app.use('*', auth)

app.get('/', async (c) => {
  const userId = c.get('userId')
  const items = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.userId, userId))

  return success(c, { items })
})

app.post('/', validateJson(cartSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  const [product] = await db
    .select({ id: products.id, isActive: products.isActive, stock: products.stock })
    .from(products)
    .where(eq(products.id, data.productId))
    .limit(1)
  if (!product || !product.isActive) {
    return fail(c, '商品已下架', 400)
  }

  if (data.variantId !== null && data.variantId !== undefined) {
    const [variant] = await db
      .select({ id: productVariants.id, productId: productVariants.productId })
      .from(productVariants)
      .where(eq(productVariants.id, data.variantId))
      .limit(1)
    if (!variant || variant.productId !== data.productId) {
      return fail(c, '规格不存在', 400)
    }
  }

  const [record] = await db.insert(cartItems).values({ ...data, userId }).returning()

  trackBusinessEvent({
    c,
    userId,
    eventType: 'cart_add',
    metadata: { productId: data.productId, variantId: data.variantId, quantity: data.quantity }
  })

  return success(c, record, 201)
})

app.put('/:id', validateJson(cartUpdateSchema), async (c) => {
  const userId = c.get('userId')
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const [existing] = await db
    .select({ id: cartItems.id })
    .from(cartItems)
    .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
    .limit(1)
  if (!existing) {
    return fail(c, '购物车商品不存在', 404)
  }

  await db
    .update(cartItems)
    .set({ quantity: data.quantity })
    .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))

  return success(c, null)
})

app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = parseInt(c.req.param('id'))
  await db
    .delete(cartItems)
    .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))

  trackBusinessEvent({ c, userId, eventType: 'cart_remove', metadata: { cartItemId: id } })

  return success(c, null)
})

export default app
