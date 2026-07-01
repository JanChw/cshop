import { Hono } from 'hono'
import { db } from '../db'
import { cartItems, products, productVariants } from '../db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { auth } from '../middleware/auth'
import { success, fail } from '../utils/response'
import { validateJson } from '../utils/validate'
import { cartSchema, cartUpdateSchema } from '../validators'
import { trackBusinessEvent } from '../utils/track'
import { imagesForProducts } from '../utils/productImages'
import type { AppEnv } from '../types/hono'

const app = new Hono<AppEnv>()
app.use('*', auth)

app.get('/', async (c) => {
  const userId = c.get('userId')
  const rows = await db
    .select({ cart: cartItems, product: products, variant: productVariants })
    .from(cartItems)
    .leftJoin(products, eq(cartItems.productId, products.id))
    .leftJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .where(eq(cartItems.userId, userId))

  const imageMap = imagesForProducts(rows.map(r => r.product?.id).filter((id): id is number => id != null))

  const items = rows.map((r) => ({
    id: r.cart.id,
    userId: r.cart.userId,
    productId: r.cart.productId,
    designId: r.cart.designId,
    variantId: r.cart.variantId,
    quantity: r.cart.quantity,
    product: r.product
      ? { id: r.product.id, name: r.product.name, basePrice: r.product.basePrice, images: imageMap.get(r.product.id) ?? [] }
      : null,
    variant: r.variant ? { id: r.variant.id, size: r.variant.size, color: r.variant.color } : null
  }))

  return success(c, items)
})

app.post('/', validateJson(cartSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  const [product] = await db
    .select({ id: products.id, isActive: products.isActive, stock: products.stock, deletedAt: products.deletedAt })
    .from(products)
    .where(and(eq(products.id, data.productId), isNull(products.deletedAt)))
    .limit(1)
  if (!product || !product.isActive) {
    return fail(c, '商品已下架', 400)
  }

  let variantId = data.variantId ?? null
  // 前端普通商品流程传 size/color 而非 variantId，此处按规格解析出 variantId
  if (variantId === null && data.size) {
    const conds = [eq(productVariants.productId, data.productId), eq(productVariants.size, data.size)]
    if (data.color) conds.push(eq(productVariants.color, data.color))
    const [v] = await db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(and(...conds))
      .limit(1)
    if (v) variantId = v.id
  }

  if (variantId !== null) {
    const [variant] = await db
      .select({ id: productVariants.id, productId: productVariants.productId })
      .from(productVariants)
      .where(eq(productVariants.id, variantId))
      .limit(1)
    if (!variant || variant.productId !== data.productId) {
      return fail(c, '规格不存在', 400)
    }
  }

  const [record] = await db.insert(cartItems).values({
    userId,
    productId: data.productId,
    designId: data.designId ?? null,
    variantId,
    quantity: data.quantity
  }).returning()

  trackBusinessEvent({
    c,
    userId,
    eventType: 'cart_add',
    metadata: { productId: data.productId, variantId, quantity: data.quantity }
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
