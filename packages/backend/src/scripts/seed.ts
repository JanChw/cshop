import { db } from '../db'
import { categories, products, productVariants, productBaseDesigns, orders, orderItems, users } from '../db/schema'
import { eq, sql } from 'drizzle-orm'

function main() {
  // Check if seed already exists
  const existing = db.select().from(categories).limit(1).all()
  if (existing.length > 0) {
    console.log('[seed] Data already exists, skipping.')
    process.exit(0)
  }

  const [cat1] = db.insert(categories).values({ name: 'T恤', slug: 't-shirts' }).returning().all()
  const [cat2] = db.insert(categories).values({ name: '外套', slug: 'jackets' }).returning().all()
  const [cat3] = db.insert(categories).values({ name: '配饰', slug: 'accessories' }).returning().all()
  console.log(`[seed] Created ${3} categories`)

  const [p1] = db.insert(products).values({
    name: '经典圆领T恤', description: '100%纯棉，舒适透气', basePrice: 99, categoryId: cat1.id, stock: 200, isActive: true,
  }).returning().all()
  const now = sql`datetime('now')`
  db.insert(productBaseDesigns).values({ productId: p1.id, frontImage: '/tshirt.png', maskImage: '/tshirt-mask.png', createdAt: now, updatedAt: now }).run()

  const [p2] = db.insert(products).values({
    name: '潮流连帽卫衣', description: '加绒保暖，潮流设计', basePrice: 299, categoryId: cat1.id, stock: 150, isActive: true,
  }).returning().all()

  const [p3] = db.insert(products).values({
    name: '修身牛仔裤', description: '弹力面料，修身版型', basePrice: 259, categoryId: cat1.id, stock: 120, isActive: true,
  }).returning().all()

  const [p4] = db.insert(products).values({
    name: '纯棉 Polo 衫', description: '商务休闲两用', basePrice: 149, categoryId: cat1.id, stock: 300, isActive: true,
  }).returning().all()

  const [p5] = db.insert(products).values({
    name: '加绒保暖外套', description: '冬季保暖必备', basePrice: 459, categoryId: cat2.id, stock: 80, isActive: false,
  }).returning().all()

  const [p6] = db.insert(products).values({
    name: '时尚太阳镜', description: 'UV400防护', basePrice: 199, categoryId: cat3.id, stock: 200, isActive: true,
  }).returning().all()

  const [p7] = db.insert(products).values({
    name: '真皮腰带', description: '头层牛皮', basePrice: 129, categoryId: cat3.id, stock: 150, isActive: true,
  }).returning().all()

  const [p8] = db.insert(products).values({
    name: '运动鞋', description: '轻便缓震', basePrice: 399, categoryId: cat3.id, stock: 100, isActive: true,
  }).returning().all()

  console.log(`[seed] Created ${8} products`)

  // Create variants for products
  const sizes = ['S', 'M', 'L', 'XL']
  const colors = ['黑色', '白色', '蓝色']
  const allProducts = [p1, p2, p3, p4, p5, p6, p7, p8]
  let variantCount = 0
  for (const p of allProducts) {
    for (const size of sizes.slice(0, 3)) {
      for (const color of colors.slice(0, 2)) {
        db.insert(productVariants).values({
          productId: p.id, size, color,
          priceAdjustment: 0, stock: Math.floor(Math.random() * 80) + 20,
        }).run()
        variantCount++
      }
    }
  }
  console.log(`[seed] Created ${variantCount} variants`)

  // Create test orders with different statuses
  const [customer] = db.insert(users).values({
    email: 'customer@example.com', passwordHash: '$2b$10$placeholder', name: '测试用户',
  }).returning().all()
  console.log(`[seed] Created test customer (ID: ${customer.id})`)

  const statuses = ['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled']
  let orderCount = 0
  for (const status of statuses) {
    for (let i = 0; i < 2; i++) {
      const product = allProducts[Math.floor(Math.random() * allProducts.length)]
      const qty = Math.floor(Math.random() * 3) + 1
      const [order] = db.insert(orders).values({
        userId: customer.id, status, total: product.basePrice * qty,
        address: '北京市朝阳区测试地址',
        createdAt: sql`datetime('now', '-' || ${i + statuses.indexOf(status) * 2} || ' days')`,
      }).returning().all()

      db.insert(orderItems).values({
        orderId: order.id, productId: product.id, productName: product.name,
        quantity: qty, unitPrice: product.basePrice, price: product.basePrice * qty,
      }).run()
      orderCount++
    }
  }
  console.log(`[seed] Created ${orderCount} test orders`)

  console.log('[seed] Done!')
}

main()
