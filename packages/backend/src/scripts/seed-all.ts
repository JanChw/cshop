import { db } from '../db'
import { categories, products, productVariants, users, userAddresses, stickers, homeSections, designConfigs, orders, orderItems, cartItems } from '../db/schema'
import { eq, sql } from 'drizzle-orm'

async function seedAll() {
  const existingCat = db.select({ id: categories.id }).from(categories).limit(1).all()
  if (existingCat.length > 0) {
    console.log('Data already exists, skipping seed-all.')
    return
  }

  // ── Categories ──
  const catData = [
    { name: '基础款', slug: 'basics', sort: 1 },
    { name: '核心款', slug: 'core', sort: 2 },
    { name: '设计师款', slug: 'designer', sort: 3 },
    { name: '定制款', slug: 'custom', sort: 4 },
    { name: '配饰', slug: 'accessories', sort: 5 }
  ]
  for (const c of catData) {
    db.insert(categories).values(c).run()
  }
  const allCats = db.select().from(categories).all()
  const catMap: Record<string, number> = {}
  for (const c of allCats) catMap[c.slug] = c.id

  // ── Products (20 from productData + p12) ──
  const allProducts = [
    { idSeed: 'p1',  name: '定制创意印花 T恤',      basePrice: 199,  originalPrice: 299, categorySlug: 'basics',      fabric: '棉质', fit: '宽松', designer: 'Jordan.Design', tags: '["Canvas Ready"]', description: '采用 100% 高品质精梳棉，手感柔软亲肤。支持多区域个性化定制，让你的创意灵感跃然衣上。', imageSeed: '3c604c9a1e87' },
    { idSeed: 'p2',  name: '重磅廓形圆领衫',         basePrice: 199,  categorySlug: 'basics',      fabric: '棉质', fit: '宽松', description: '重磅棉质廓形剪裁，宽身不挑身材，极简主义的首选基础款。', imageSeed: '3c604c9a1e87' },
    { idSeed: 'p3',  name: '极简连帽卫衣',            basePrice: 399,  categorySlug: 'basics',      fabric: '棉质', fit: '宽松', description: '极简风格的连帽卫衣，采用优质棉质面料，舒适透气，是日常穿搭的百搭之选。', imageSeed: '8a17ad401514' },
    { idSeed: 'p4',  name: '阔腿束口短裤',            basePrice: 159,  categorySlug: 'basics',      fabric: '棉质', fit: '宽松', description: '宽松阔腿剪裁搭配束口设计，轻松打造休闲运动风。', imageSeed: 'ef2c5fff6450' },
    { idSeed: 'p5',  name: '精梳棉长袖',              basePrice: 249,  categorySlug: 'basics',      fabric: '棉质', fit: '宽松', description: '精梳棉材质长袖T恤，亲肤柔软，四季皆宜的基础单品。', imageSeed: 'c8d4d08aa439' },
    { idSeed: 'p6',  name: '重磅基础圆领T恤',         basePrice: 299,  categorySlug: 'core',        fabric: '混纺', fit: '常规', description: '重磅混纺面料圆领T恤，挺括有型，耐洗不易变形。', imageSeed: '5c97e3382aae' },
    { idSeed: 'p7',  name: '全棉连帽卫衣',            basePrice: 589,  originalPrice: 699,  categorySlug: 'core',   fabric: '混纺', fit: '常规', description: '全棉混纺连帽卫衣，内里加绒处理，秋冬必备保暖单品。', imageSeed: 'cc1602a6ae6c' },
    { idSeed: 'p8',  name: '艺术家合作款短袖',        basePrice: 899,  categorySlug: 'designer',    fabric: '涤纶', fit: '修身', designer: 'Alex Chen', description: '与艺术家 Alex Chen 联名合作，独家艺术印花设计，限量发售。', imageSeed: '18b9254c6303' },
    { idSeed: 'p9',  name: '手工水洗丹宁夹克',        basePrice: 1299, categorySlug: 'custom',     fabric: '棉质', fit: '宽松', tags: '["New"]', description: '手工水洗做旧工艺，每件都独一无二。限量定制，尊享个性体验。', imageSeed: 'ebbd34802107' },
    { idSeed: 'p10', name: '莫代尔混纺T恤',           basePrice: 349,  categorySlug: 'core',        fabric: '混纺', fit: '常规', description: '莫代尔混纺面料，丝滑触感，垂坠感极佳，通勤休闲两相宜。', imageSeed: '91c83495b360' },
    { idSeed: 'p11', name: '廓形立领衬衫',            basePrice: 749,  categorySlug: 'designer',    fabric: '涤纶', fit: '修身', designer: 'Li Wei', description: '与设计师 Li Wei 合作款，廓形立领剪裁，打破传统衬衫的刻板印象。', imageSeed: 'd6148e3dc9b7' },
    { idSeed: 's1',  name: '简约基础款 T恤',          basePrice: 299,  categorySlug: 'basics',      fabric: '棉质', fit: '常规', description: '大地色系 / 有机棉。天然有机棉面料，温柔呵护肌肤。', imageSeed: '098e0d9fcdd3' },
    { idSeed: 's2',  name: '重磅廓形连帽衫',          basePrice: 599,  categorySlug: 'core',        fabric: '混纺', fit: '宽松', description: '落肩设计 / 舒适透气。重磅混纺面料，打造舒适有型的街头轮廓。', imageSeed: 'ea141792a20f' },
    { idSeed: 's3',  name: '极简立领卫衣',            basePrice: 459,  categorySlug: 'designer',    fabric: '涤纶', fit: '修身', designer: 'Studio_99', description: '沙色系列 / 限量版。极简立领设计，低调中见格调。', imageSeed: 'a0e3d63f8424' },
    { idSeed: 's4',  name: '修身针织短袖',            basePrice: 389,  categorySlug: 'core',        fabric: '棉质', fit: '修身', description: '深灰色 / 经典剪裁。精细针织工艺，修身显瘦。', imageSeed: 'd56819f894d3' },
    { idSeed: 's8',  name: '织锦缎棒球帽',            basePrice: 199,  categorySlug: 'accessories', fabric: '混纺', fit: '常规', description: '限定配色 / 可调节。织锦缎面料搭配精致刺绣，质感出众。', imageSeed: '9e32a18bc5f1' },
    { idSeed: 's9',  name: '机能斜挎包',              basePrice: 259,  categorySlug: 'accessories', fabric: '涤纶', fit: '常规', description: '防水面料 / 多隔层。轻量机能设计，日常通勤轻松收纳。', imageSeed: '2d6a4f8c3e71' },
    { idSeed: 'p12', name: '简约概念帆布袋',           basePrice: 88,   categorySlug: 'accessories', fabric: '混纺', fit: '常规', description: '简约设计帆布袋，环保耐用，日常出街百搭之选。', imageSeed: 'a7b8c9d0e1f2' },
  ]

  for (const p of allProducts) {
    const imageUrl = `https://picsum.photos/seed/${p.imageSeed}/400/500`
    const thumbUrls = [
      `https://picsum.photos/seed/${p.imageSeed}-t1/400/500`,
      `https://picsum.photos/seed/${p.imageSeed}-t2/400/500`,
      `https://picsum.photos/seed/${p.imageSeed}-t3/400/500`
    ]
    db.insert(products).values({
      name: p.name,
      description: p.description ?? null,
      basePrice: p.basePrice,
      categoryId: catMap[p.categorySlug],
      fabric: p.fabric,
      fit: p.fit,
      designer: p.designer ?? null,
      originalPrice: p.originalPrice ?? null,
      tags: p.tags ?? null,
      images: JSON.stringify([imageUrl, ...thumbUrls]),
      stock: 100,
      isActive: true
    }).run()
  }

  // ── Variants: each product gets 3 sizes × 2 colors ──
  const allDbProducts = db.select().from(products).all()
  const sizeColors: Record<string, { sizes: string[], colors: string[] }> = {
    '常规': { sizes: ['S', 'M', 'L', 'XL'], colors: ['白色', '黑色', '灰色'] },
    '宽松': { sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['白色', '黑色', '灰色'] },
    '修身': { sizes: ['M', 'L', 'XL'], colors: ['白色', '黑色'] }
  }
  // Accessories override
  const accFits: Record<string, { sizes: string[], colors: string[] }> = {
    '织锦缎棒球帽': { sizes: ['均码'], colors: ['黑色', '酒红色', '墨绿色'] },
    '机能斜挎包': { sizes: ['均码'], colors: ['黑色', '军绿色', '深灰色'] },
    '简约概念帆布袋': { sizes: ['均码'], colors: ['黑色', '米色'] }
  }

  for (const prod of allDbProducts) {
    const fit = accFits[prod.name] ?? sizeColors[prod.fit ?? '常规'] ?? sizeColors['常规']
    for (const size of fit.sizes) {
      for (const color of fit.colors) {
        db.insert(productVariants).values({
          productId: prod.id,
          size,
          color,
          material: null,
          weight: null,
          priceAdjustment: 0,
          stock: 50
        }).run()
      }
    }
  }

  // ── Users ──
  const testPasswordHash = await Bun.password.hash('123456', { algorithm: 'bcrypt', cost: 10 })
  db.insert(users).values({
    email: 'customer@example.com',
    passwordHash: testPasswordHash,
    name: '陈小周',
    phone: '13800138000',
    bio: '高级定制设计师 · Creator',
    gender: 'female',
    birthday: '1995-08-24',
    avatar: null
  }).run()

  const [testUser] = db.select().from(users).where(eq(users.email, 'customer@example.com')).limit(1).all()

  // ── Addresses ──
  const addresses = [
    { name: '陈小周', phone: '13800138000', province: '广东省', city: '深圳市', district: '南山区', detail: '科技园南区A栋1201', isDefault: true },
    { name: '陈小周', phone: '13800138000', province: '北京市', city: '北京市', district: '朝阳区', detail: '望京SOHO T3 1508', isDefault: false },
    { name: '陈先生', phone: '13912345678', province: '上海市', city: '上海市', district: '静安区', detail: '南京西路1266号恒隆广场', isDefault: false }
  ]
  for (const addr of addresses) {
    db.insert(userAddresses).values({ userId: testUser.id, ...addr }).run()
  }

  // ── Orders (3 orders in different statuses) ──
  const [prod1] = db.select().from(products).where(eq(products.name, '定制创意印花 T恤')).limit(1).all()
  const [prod6] = db.select().from(products).where(eq(products.name, '重磅基础圆领T恤')).limit(1).all()
  const [prod7] = db.select().from(products).where(eq(products.name, '全棉连帽卫衣')).limit(1).all()

  const orderDefs = [
    { status: 'pending' as const, days: 1, line: { productId: prod1.id, quantity: 1, price: prod1.basePrice } },
    { status: 'shipped' as const, days: 3, line: { productId: prod6.id, quantity: 1, price: prod6.basePrice } },
    { status: 'completed' as const, days: 10, line: { productId: prod7.id, quantity: 1, price: prod7.basePrice } },
  ]
  for (const od of orderDefs) {
    const createdAt = new Date(Date.now() - od.days * 86400000).toISOString()
    const [order] = db.insert(orders).values({
      userId: testUser.id,
      status: od.status,
      total: od.line.price,
      address: '广东省深圳市南山区科技园南区A栋1201',
      createdAt,
      updatedAt: createdAt
    }).returning().all()

    db.insert(orderItems).values({
      orderId: order.id,
      productId: od.line.productId,
      quantity: od.line.quantity,
      price: od.line.price
    }).run()

    if (od.status === 'shipped') {
      db.update(orders).set({
        shippedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        trackingNo: 'SF' + String(1000000000 + Math.floor(Math.random() * 9000000000))
      }).where(eq(orders.id, order.id)).run()
    }
    if (od.status === 'completed') {
      db.update(orders).set({
        paidAt: new Date(Date.now() - 8 * 86400000).toISOString(),
        shippedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        completedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        trackingNo: 'SF' + String(1000000000 + Math.floor(Math.random() * 9000000000))
      }).where(eq(orders.id, order.id)).run()
    }
  }

  // ── Cart items (2 items) ──
  const [v1] = db.select().from(productVariants).where(eq(productVariants.productId, prod1.id)).limit(1).all()
  const [v6] = db.select().from(productVariants).where(eq(productVariants.productId, prod6.id)).limit(1).all()

  db.insert(cartItems).values({
    userId: testUser.id,
    productId: prod1.id,
    variantId: v1.id,
    quantity: 1
  }).run()
  db.insert(cartItems).values({
    userId: testUser.id,
    productId: prod6.id,
    variantId: v6.id,
    quantity: 2
  }).run()

  // ── System Stickers (SVG-to-PNG placeholder) ──
  const stickerDir = '/home/ubuntu/workspace/cshop/packages/backend/data/stickers'
  const fs = require('node:fs')
  const path = require('node:path')
  if (!fs.existsSync(stickerDir)) fs.mkdirSync(stickerDir, { recursive: true })

  const systemStickers = [
    { name: '爱心', category: 'recommend', color: '#ff6b6b' },
    { name: '星星', category: 'recommend', color: '#ffd93d' },
    { name: '笑脸', category: 'recommend', color: '#ffd93d' },
    { name: '闪电', category: 'recommend', color: '#ffd93d' },
    { name: '圆形', category: 'geometric', color: '#6bcb77' },
    { name: '方形', category: 'geometric', color: '#6bcb77' },
    { name: '三角', category: 'geometric', color: '#6bcb77' },
    { name: '六边', category: 'geometric', color: '#6bcb77' },
    { name: '叶子', category: 'nature', color: '#4d8b4d' },
    { name: '花朵', category: 'nature', color: '#ff6b9d' },
    { name: '太阳', category: 'nature', color: '#ffd93d' },
    { name: '月亮', category: 'nature', color: '#a8a8a8' },
    { name: '波浪', category: 'abstract', color: '#6bcb77' },
    { name: '螺旋', category: 'abstract', color: '#a8a8a8' },
    { name: '墨点', category: 'abstract', color: '#3b3b3b' },
  ]

  for (const st of systemStickers) {
    const filename = `sticker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.svg`
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="${st.color}" rx="20" opacity="0.2"/>
      <text x="100" y="110" text-anchor="middle" font-size="40" fill="${st.color}">${st.name === '笑脸' ? '😊' : st.name === '爱心' ? '❤️' : st.name === '星星' ? '⭐' : st.name === '闪电' ? '⚡' : st.name === '圆形' ? '●' : st.name === '方形' ? '■' : st.name === '三角' ? '▲' : st.name === '六边' ? '⬡' : st.name === '叶子' ? '🌿' : st.name === '花朵' ? '🌸' : st.name === '太阳' ? '☀️' : st.name === '月亮' ? '🌙' : st.name === '波浪' ? '〰️' : st.name === '螺旋' ? '🌀' : st.name === '墨点' ? '●' : '?'}</text>
    </svg>`
    fs.writeFileSync(path.join(stickerDir, filename), svgContent)
    db.insert(stickers).values({
      name: st.name,
      category: st.category,
      imagePath: `/api/v1/stickers/${filename}`,
      width: 200,
      height: 200
    }).run()
  }

  // ── Home Sections ──
  const sections = [
    { type: 'hero' as const, title: 'ByChooow Studio', subTitle: '将创意，转化为高级成衣。', sort: 1, data: JSON.stringify({ images: [{ device: 'mobile', url: 'https://picsum.photos/seed/bychooow-hero/800/1000' }, { device: 'tablet', url: 'https://picsum.photos/seed/bychooow-hero/1200/800' }] }) },
    { type: 'videos' as const, title: 'Learn', subTitle: '教学视频', sort: 2, data: JSON.stringify({ videos: [{ title: 'DIY 服装设计入门', image: 'https://picsum.photos/seed/7f8cf89efb0e/400/500', duration: '12:35' }, { title: '手绘模式进阶指南', image: 'https://picsum.photos/seed/529e783db21a/400/500', duration: '18:42' }] }) },
    { type: 'product_row' as const, title: 'Basics', subTitle: '二次创作', sort: 3, data: JSON.stringify({ contents: [{ productId: 1, cover: 'https://picsum.photos/seed/3c604c9a1e87/400/500' }, { productId: 2, cover: 'https://picsum.photos/seed/8a17ad401514/400/500' }, { productId: 3, cover: 'https://picsum.photos/seed/ef2c5fff6450/400/500' }, { productId: 4, cover: 'https://picsum.photos/seed/c8d4d08aa439/400/500' }] }) },
    { type: 'card_grid' as const, title: 'Essentials', subTitle: '必备单品', sort: 4, data: JSON.stringify({ contents: [{ productId: null, cover: 'https://picsum.photos/seed/be82a4351710/400/500', title: '全季胶囊衣橱', subtitle: "Editor's Choice" }, { productId: null, cover: 'https://picsum.photos/seed/5b544b58712c/400/500', title: '创意配饰' }, { productId: null, cover: 'https://picsum.photos/seed/3b1bd334209c/400/500', title: '色彩灵感' }] }) },
    { type: 'designer_grid' as const, title: 'Collaborations', subTitle: '联名工坊', sort: 5, data: JSON.stringify({ contents: [{ productId: null, cover: 'https://picsum.photos/seed/bd70f38efcad/400/500', name: 'Alex Chen x ByChooow', series: '未来主义系列' }, { productId: null, cover: 'https://picsum.photos/seed/0e8e0ccdb74e/400/500', name: 'Li Wei x ByChooow', series: '极简几何' }, { productId: null, cover: 'https://picsum.photos/seed/0430d3c9e90f/400/500', name: 'Studio Z x ByChooow', series: '光影实验' }] }) },
    { type: 'product_row' as const, title: '新品推荐', subTitle: null, sort: 6, data: JSON.stringify({ contents: [] }) },
    { type: 'card_grid' as const, title: '精选推荐', subTitle: null, sort: 7, data: JSON.stringify({ contents: [] }) }
  ]
  for (const s of sections) {
    db.insert(homeSections).values(s).run()
  }
  console.log(`Seeded ${sections.length} home sections.`)

  // ── Design Configs ──
  const configs = [
    { configGroup: 'tshirt_color' as const, name: '珍珠白', value: '#ffffff', sort: 1 },
    { configGroup: 'tshirt_color' as const, name: '极简黑', value: '#1a1a1a', sort: 2 },
    { configGroup: 'tshirt_color' as const, name: '麻灰色', value: '#b5b5b5', sort: 3 },
    { configGroup: 'tshirt_color' as const, name: '撒哈拉金', value: '#c2652a', sort: 4 },
    { configGroup: 'tshirt_color' as const, name: '森林绿', value: '#2d4a3e', sort: 5 },
    { configGroup: 'tshirt_color' as const, name: '酒红色', value: '#8c3c3c', sort: 6 },
    { configGroup: 'text_palette' as const, name: '#c2652a', value: '#c2652a', sort: 1 },
    { configGroup: 'text_palette' as const, name: '#3a302a', value: '#3a302a', sort: 2 },
    { configGroup: 'text_palette' as const, name: '#8c3c3c', value: '#8c3c3c', sort: 3 },
    { configGroup: 'text_palette' as const, name: '#ffffff', value: '#ffffff', sort: 4 },
    { configGroup: 'text_palette' as const, name: '#f0a878', value: '#f0a878', sort: 5 },
    { configGroup: 'font' as const, name: 'Manrope', value: 'Manrope', extra: JSON.stringify({ sub: 'Modern Sans' }), sort: 1 },
    { configGroup: 'font' as const, name: 'Space Mono', value: 'Space Mono', extra: JSON.stringify({ sub: 'Technical Look' }), sort: 2 },
    { configGroup: 'font' as const, name: 'System Sans', value: 'system-ui, sans-serif', extra: JSON.stringify({ sub: 'Native UI' }), sort: 3 },
    { configGroup: 'font' as const, name: 'System Mono', value: 'ui-monospace, monospace', extra: JSON.stringify({ sub: 'Native Mono' }), sort: 4 },
    { configGroup: 'brush_color' as const, name: '#0052FF', value: '#0052FF', sort: 1 },
    { configGroup: 'brush_color' as const, name: '#151c27', value: '#151c27', sort: 2 },
    { configGroup: 'brush_color' as const, name: '#F87171', value: '#F87171', sort: 3 },
    { configGroup: 'brush_color' as const, name: '#34D399', value: '#34D399', sort: 4 },
    { configGroup: 'brush_color' as const, name: '#c2652a', value: '#c2652a', sort: 5 },
    { configGroup: 'brush_style' as const, name: 'pencil', value: 'pencil', extra: JSON.stringify({ label: '铅笔', icon: 'edit' }), sort: 1 },
    { configGroup: 'brush_style' as const, name: 'marker', value: 'marker', extra: JSON.stringify({ label: '马克笔', icon: 'circle' }), sort: 2 },
    { configGroup: 'brush_style' as const, name: 'spray', value: 'spray', extra: JSON.stringify({ label: '喷雾', icon: 'water_drop' }), sort: 3 }
  ]
  for (const cfg of configs) {
    db.insert(designConfigs).values({ ...cfg, extra: cfg.extra ?? null, isActive: true }).run()
  }
  console.log(`Seeded ${configs.length} design configs.`)

  console.log('Seed complete!')
  console.log(`  Test user: customer@example.com / 123456`)
  console.log(`  Products: ${allDbProducts.length}`)
}

seedAll().catch(console.error)
