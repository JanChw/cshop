import { db } from '../db'
import { menus } from '../db/schema'
import { eq } from 'drizzle-orm'

interface MenuSeed {
  name: string
  path: string
  icon: string | null
  sort: number
  children?: { name: string; path: string; sort: number }[]
}

const ADMIN_MENUS: MenuSeed[] = [
  { name: '仪表盘', path: '/', icon: 'LayoutDashboard', sort: 0 },
  { name: '商品管理', path: '/products', icon: 'Package', sort: 1 },
  { name: '订单管理', path: '/orders', icon: 'ShoppingCart', sort: 2 },
  { name: '分类管理', path: '/categories', icon: 'Folder', sort: 3 },
  { name: '用户管理', path: '/users', icon: 'Users', sort: 4 },
  { name: '员工管理', path: '/staff', icon: 'UserCheck', sort: 5 },
  { name: '数据分析', path: '/analytics', icon: 'Activity', sort: 6 },
  {
    name: '内容管理', path: '', icon: 'Palette', sort: 7,
    children: [
      { name: '首页配置', path: '/home-content', sort: 0 },
      { name: '设计配置', path: '/design-content', sort: 1 },
      { name: '贴纸管理', path: '/stickers', sort: 2 },
    ]
  },
  {
    name: '系统管理', path: '', icon: 'Settings', sort: 8,
    children: [
      { name: '系统设置', path: '/settings', sort: 0 },
      { name: '角色权限', path: '/roles', sort: 1 },
      { name: '数据备份', path: '/backups', sort: 2 },
    ]
  },
]

function seedMenus() {
  const existing = db.select({ id: menus.id }).from(menus).where(eq(menus.type, 'admin')).limit(1).all()
  if (existing.length > 0) {
    console.log('[seed-menus] Admin menus already exist, skipping.')
    return
  }

  db.transaction((tx) => {
    for (const group of ADMIN_MENUS) {
      if (!group.children) {
        tx.insert(menus).values({
          name: group.name,
          path: group.path,
          icon: group.icon,
          sort: group.sort,
          isVisible: true,
          type: 'admin'
        }).run()
      } else {
        const [parent] = tx.insert(menus).values({
          name: group.name,
          path: group.path,
          icon: group.icon,
          sort: group.sort,
          isVisible: true,
          type: 'admin'
        }).returning({ id: menus.id }).all()

        for (const child of group.children) {
          tx.insert(menus).values({
            parentId: parent.id,
            name: child.name,
            path: child.path,
            icon: null,
            sort: child.sort,
            isVisible: true,
            type: 'admin'
          }).run()
        }
      }
    }
  })

  const total = db.select({ id: menus.id }).from(menus).where(eq(menus.type, 'admin')).all().length
  console.log(`[seed-menus] Inserted ${ADMIN_MENUS.length} menu groups with children. Total admin menu items: ${total}`)
}

seedMenus()
