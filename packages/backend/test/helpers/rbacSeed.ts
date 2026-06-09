import { db } from '../../src/db'
import { roles, permissions, rolePermissions } from '../../src/db/schema'
import { ALL_PERMISSIONS, SYSTEM_ROLES } from '../../src/utils/permissions'
import { sql } from 'drizzle-orm'

// Re-seed RBAC tables in tests (since beforeEach deletes everything).
// Mirrors the SQL seed in drizzle/0003 but runs as TypeScript so we don't
// need to also re-run the migration.
export function reseedRbac(): void {
  db.delete(rolePermissions).run()
  db.delete(roles).run()
  db.delete(permissions).run()

  for (const role of SYSTEM_ROLES) {
    db.insert(roles).values({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isSystem: true
    }).run()
  }

  for (const perm of ALL_PERMISSIONS) {
    db.insert(permissions).values({
      code: perm.code,
      module: perm.module,
      description: perm.description
    }).run()
  }

  const allRoles = db.select().from(roles).all()
  const allPerms = db.select().from(permissions).all()
  const roleByName = new Map(allRoles.map(r => [r.name, r.id]))
  const permByCode = new Map(allPerms.map(p => [p.code, p.id]))

  for (const permId of allPerms.map(p => p.id)) {
    db.insert(rolePermissions).values({ roleId: roleByName.get('super_admin')!, permissionId: permId }).run()
  }

  const productMgrPerms = [
    'product.create', 'product.read', 'product.update', 'product.delete',
    'category.create', 'category.update', 'category.delete',
    'sticker.create', 'sticker.update', 'sticker.delete',
    'analytics.read', 'menu.read'
  ]
  for (const code of productMgrPerms) {
    const pid = permByCode.get(code)
    if (pid) db.insert(rolePermissions).values({ roleId: roleByName.get('product_mgr')!, permissionId: pid }).run()
  }

  const orderMgrPerms = ['order.read', 'order.update_status', 'user.read', 'analytics.read', 'menu.read']
  for (const code of orderMgrPerms) {
    const pid = permByCode.get(code)
    if (pid) db.insert(rolePermissions).values({ roleId: roleByName.get('order_mgr')!, permissionId: pid }).run()
  }

  const viewerPerms = ['analytics.read', 'product.read', 'order.read', 'menu.read']
  for (const code of viewerPerms) {
    const pid = permByCode.get(code)
    if (pid) db.insert(rolePermissions).values({ roleId: roleByName.get('analytics_viewer')!, permissionId: pid }).run()
  }
}
