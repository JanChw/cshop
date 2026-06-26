import { db } from '../db'
import { categories, products, productVariants } from '../db/schema'
import { eq } from 'drizzle-orm'

interface NewProduct {
  name: string
  basePrice: number
  originalPrice?: number
  categorySlug: string
  fabric: string
  fit: string
  designer?: string
  tags?: string
  description: string
  imageSeed: string
}

const NEW_PRODUCTS: NewProduct[] = [
  // ── 设计师款 (+2 → 5) ──
  {
    name: '解构拼接衬衫',
    basePrice: 899,
    originalPrice: 1099,
    categorySlug: 'designer',
    fabric: '涤纶',
    fit: '修身',
    designer: 'Muse_Lab',
    tags: '["Limited"]',
    description: '解构主义剪裁，拼接撞色设计，Muse_Lab 合作限定款。',
    imageSeed: 'f4a3b2c1d0e5'
  },
  {
    name: '渐变扎染卫衣',
    basePrice: 699,
    categorySlug: 'designer',
    fabric: '涤纶',
    fit: '修身',
    designer: 'Studio_99',
    description: '手工渐变扎染工艺，每件纹路独一无二。Studio_99 联名系列。',
    imageSeed: 'b8c7d6e5f4a3'
  },
  // ── 定制款 (+4 → 5) ──
  {
    name: '字母刺绣棒球夹克',
    basePrice: 1599,
    originalPrice: 1999,
    categorySlug: 'custom',
    fabric: '棉质',
    fit: '宽松',
    description: '高端定制字母刺绣，纯棉面料，支持个性化字母定制。',
    imageSeed: 'e5f4a3b2c1d0'
  },
  {
    name: '手绘印花连帽卫衣',
    basePrice: 899,
    categorySlug: 'custom',
    fabric: '棉质',
    fit: '宽松',
    description: '手绘艺术印花，可定制图案位置与配色，专属你的艺术卫衣。',
    imageSeed: 'd0e5f4a3b2c1'
  },
  {
    name: '定制姓名刺绣衬衫',
    basePrice: 599,
    originalPrice: 799,
    categorySlug: 'custom',
    fabric: '棉质',
    fit: '宽松',
    description: '精选纯棉面料，支持姓名/字母刺绣定制，商务休闲两相宜。',
    imageSeed: 'c1d0e5f4a3b2'
  },
  {
    name: '个人徽章牛仔外套',
    basePrice: 1299,
    categorySlug: 'custom',
    fabric: '棉质',
    fit: '宽松',
    tags: '["New"]',
    description: '丹宁面料手工做旧，可定制个人徽章与刺绣图案，独一无二。',
    imageSeed: 'a3b2c1d0e5f4'
  },
  // ── 配饰 (+2 → 5) ──
  {
    name: '简约帆布腰带',
    basePrice: 129,
    categorySlug: 'accessories',
    fabric: '混纺',
    fit: '常规',
    description: '高品质帆布腰带，金属扣头，简约百搭。',
    imageSeed: 'b2c1d0e5f4a3'
  },
  {
    name: '纯色冷感毛巾',
    basePrice: 79,
    categorySlug: 'accessories',
    fabric: '涤纶',
    fit: '常规',
    description: '超细纤维冷感面料，速干透气，运动出行必备。',
    imageSeed: '9f8e7d6c5b4a'
  },
]

function insertProducts() {
  const allCats = db.select().from(categories).all()
  const catMap: Record<string, number> = {}
  for (const c of allCats) catMap[c.slug] = c.id

  const sizeColors: Record<string, { sizes: string[]; colors: string[] }> = {
    '常规': { sizes: ['S', 'M', 'L', 'XL'], colors: ['白色', '黑色', '灰色'] },
    '宽松': { sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['白色', '黑色', '灰色'] },
    '修身': { sizes: ['M', 'L', 'XL'], colors: ['白色', '黑色'] },
  }

  const accOverrides: Record<string, { sizes: string[]; colors: string[] }> = {
    '简约帆布腰带': { sizes: ['均码'], colors: ['黑色', '卡其色', '军绿色'] },
    '纯色冷感毛巾': { sizes: ['均码'], colors: ['蓝色', '灰色', '粉色'] },
  }

  let count = 0
  for (const p of NEW_PRODUCTS) {
    const catId = catMap[p.categorySlug]
    if (!catId) {
      console.error(`  Category "${p.categorySlug}" not found, skipping "${p.name}"`)
      continue
    }

    const imageUrl = `https://picsum.photos/seed/${p.imageSeed}/400/500`
    const thumbUrls = [
      `https://picsum.photos/seed/${p.imageSeed}-t1/400/500`,
      `https://picsum.photos/seed/${p.imageSeed}-t2/400/500`,
      `https://picsum.photos/seed/${p.imageSeed}-t3/400/500`
    ]

    const [prod] = db.insert(products).values({
      name: p.name,
      description: p.description,
      basePrice: p.basePrice,
      categoryId: catId,
      fabric: p.fabric,
      fit: p.fit,
      designer: p.designer ?? null,
      originalPrice: p.originalPrice ?? null,
      tags: p.tags ?? null,
      images: JSON.stringify([imageUrl, ...thumbUrls]),
      stock: 100,
      isActive: true
    }).returning().all()

    // Create variants
    const fit = accOverrides[p.name] ?? sizeColors[p.fit] ?? sizeColors['常规']
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

    count++
    console.log(`  [${count}/${NEW_PRODUCTS.length}] ${p.name} (${p.categorySlug}) — variants: ${fit.sizes.length * fit.colors.length}`)
  }

  console.log(`\nDone! ${count} new products added.`)
}

insertProducts()
