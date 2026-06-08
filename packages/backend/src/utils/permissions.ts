export type PermissionCode =
  | 'product.create' | 'product.read' | 'product.update' | 'product.delete'
  | 'order.read' | 'order.update_status'
  | 'user.read' | 'user.update' | 'user.disable'
  | 'analytics.read' | 'analytics.export'
  | 'staff.read' | 'staff.create' | 'staff.update' | 'staff.delete'
  | 'settings.read' | 'settings.update'
  | 'category.create' | 'category.update' | 'category.delete'
  | 'sticker.create' | 'sticker.update' | 'sticker.delete'
  | 'backup.create' | 'backup.download' | 'backup.delete'

export const SYSTEM_ROLE_NAMES = {
  SUPER_ADMIN: 'super_admin',
  PRODUCT_MGR: 'product_mgr',
  ORDER_MGR: 'order_mgr',
  ANALYTICS_VIEWER: 'analytics_viewer'
} as const

export const SYSTEM_ROLES: Array<{ name: string; displayName: string; description: string }> = [
  { name: SYSTEM_ROLE_NAMES.SUPER_ADMIN, displayName: '超级管理员', description: '拥有全部权限' },
  { name: SYSTEM_ROLE_NAMES.PRODUCT_MGR, displayName: '商品管理员', description: '负责商品和分类管理' },
  { name: SYSTEM_ROLE_NAMES.ORDER_MGR, displayName: '订单管理员', description: '负责订单处理' },
  { name: SYSTEM_ROLE_NAMES.ANALYTICS_VIEWER, displayName: '数据观察员', description: '仅查看分析数据' }
]

export const ALL_PERMISSIONS: Array<{ code: PermissionCode; module: string; description: string }> = [
  { code: 'product.create', module: 'product', description: '创建商品' },
  { code: 'product.read', module: 'product', description: '查看商品' },
  { code: 'product.update', module: 'product', description: '更新商品' },
  { code: 'product.delete', module: 'product', description: '删除商品' },
  { code: 'order.read', module: 'order', description: '查看订单' },
  { code: 'order.update_status', module: 'order', description: '更新订单状态' },
  { code: 'user.read', module: 'user', description: '查看用户' },
  { code: 'user.update', module: 'user', description: '更新用户' },
  { code: 'user.disable', module: 'user', description: '禁用用户' },
  { code: 'analytics.read', module: 'analytics', description: '查看分析数据' },
  { code: 'analytics.export', module: 'analytics', description: '导出分析数据' },
  { code: 'staff.read', module: 'staff', description: '查看员工' },
  { code: 'staff.create', module: 'staff', description: '创建员工' },
  { code: 'staff.update', module: 'staff', description: '更新员工' },
  { code: 'staff.delete', module: 'staff', description: '删除员工' },
  { code: 'settings.read', module: 'settings', description: '查看设置' },
  { code: 'settings.update', module: 'settings', description: '更新设置' },
  { code: 'category.create', module: 'category', description: '创建分类' },
  { code: 'category.update', module: 'category', description: '更新分类' },
  { code: 'category.delete', module: 'category', description: '删除分类' },
  { code: 'sticker.create', module: 'sticker', description: '创建贴纸' },
  { code: 'sticker.update', module: 'sticker', description: '更新贴纸' },
  { code: 'sticker.delete', module: 'sticker', description: '删除贴纸' },
  { code: 'backup.create', module: 'backup', description: '创建备份' },
  { code: 'backup.download', module: 'backup', description: '下载备份' },
  { code: 'backup.delete', module: 'backup', description: '删除备份' }
]
