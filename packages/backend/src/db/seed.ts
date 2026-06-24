import { db } from './index'
import { homeSections, designConfigs } from './schema'

async function seed() {
  const existingSections = db.select({ id: homeSections.id }).from(homeSections).limit(1).all()
  if (existingSections.length > 0) {
    console.log('Home sections already exist, skipping seed.')
    return
  }

  const sections = [
    {
      type: 'hero' as const,
      title: 'ByChooow Studio',
      subTitle: '将创意，转化为高级成衣。',
      sort: 1,
      data: JSON.stringify({
        images: [
          { device: 'mobile', url: 'https://picsum.photos/seed/bychooow-hero/800/1000' },
          { device: 'tablet', url: 'https://picsum.photos/seed/bychooow-hero/1200/800' }
        ]
      })
    },
    {
      type: 'videos' as const,
      title: 'Learn',
      subTitle: '教学视频',
      sort: 2,
      data: JSON.stringify({
        videos: [
          { title: 'DIY 服装设计入门', image: 'https://picsum.photos/seed/7f8cf89efb0e/400/500', duration: '12:35' },
          { title: '手绘模式进阶指南', image: 'https://picsum.photos/seed/529e783db21a/400/500', duration: '18:42' }
        ]
      })
    },
    {
      type: 'product_row' as const,
      title: 'Basics',
      subTitle: '二次创作',
      sort: 3,
      data: JSON.stringify({
        contents: [
          { productId: 1, cover: 'https://picsum.photos/seed/3c604c9a1e87/400/500' },
          { productId: 2, cover: 'https://picsum.photos/seed/8a17ad401514/400/500' },
          { productId: 3, cover: 'https://picsum.photos/seed/ef2c5fff6450/400/500' },
          { productId: 4, cover: 'https://picsum.photos/seed/c8d4d08aa439/400/500' }
        ]
      })
    },
    {
      type: 'card_grid' as const,
      title: 'Essentials',
      subTitle: '必备单品',
      sort: 4,
      data: JSON.stringify({
        contents: [
          { productId: null, cover: 'https://picsum.photos/seed/be82a4351710/400/500', title: '全季胶囊衣橱', subtitle: "Editor's Choice" },
          { productId: null, cover: 'https://picsum.photos/seed/5b544b58712c/400/500', title: '创意配饰' },
          { productId: null, cover: 'https://picsum.photos/seed/3b1bd334209c/400/500', title: '色彩灵感' }
        ]
      })
    },
    {
      type: 'designer_grid' as const,
      title: 'Collaborations',
      subTitle: '联名工坊',
      sort: 5,
      data: JSON.stringify({
        contents: [
          { productId: null, cover: 'https://picsum.photos/seed/bd70f38efcad/400/500', name: 'Alex Chen x ByChooow', series: '未来主义系列' },
          { productId: null, cover: 'https://picsum.photos/seed/0e8e0ccdb74e/400/500', name: 'Li Wei x ByChooow', series: '极简几何' },
          { productId: null, cover: 'https://picsum.photos/seed/0430d3c9e90f/400/500', name: 'Studio Z x ByChooow', series: '光影实验' }
        ]
      })
    },
    {
      type: 'product_row' as const,
      title: '新品推荐',
      subTitle: null,
      sort: 6,
      data: JSON.stringify({ contents: [] })
    },
    {
      type: 'card_grid' as const,
      title: '精选推荐',
      subTitle: null,
      sort: 7,
      data: JSON.stringify({ contents: [] })
    }
  ]

  for (const section of sections) {
    db.insert(homeSections).values(section).run()
  }
  console.log(`Seeded ${sections.length} home sections.`)

  // Seed design configs (unchanged)
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

  for (const config of configs) {
    db.insert(designConfigs).values({ configGroup: config.configGroup, name: config.name, value: config.value, extra: config.extra ?? null, sort: config.sort, isActive: true }).run()
  }
  console.log(`Seeded ${configs.length} design configs.`)
}

seed().catch(console.error)
