import { db } from '../db'
import { roles, permissions, rolePermissions } from '../db/schema'
import { SYSTEM_ROLES, ALL_PERMISSIONS } from '../utils/permissions'
import { eq } from 'drizzle-orm'

function ensureRolesAndPermissions() {
  const existingRoles = db.select().from(roles).all()
  if (existingRoles.length > 0) {
    console.log('[seed-roles] Roles already initialized, skipping.')
    return
  }

  db.transaction((tx) => {
    const insertedRoles: Record<string, number> = {}
    for (const r of SYSTEM_ROLES) {
      const [role] = tx.insert(roles).values({
        name: r.name,
        displayName: r.displayName,
        description: r.description,
        isSystem: true
      }).returning().all()
      insertedRoles[r.name] = role.id
    }

    const insertedPerms: Record<string, number> = {}
    for (const p of ALL_PERMISSIONS) {
      const [perm] = tx.insert(permissions).values({
        code: p.code,
        module: p.module,
        description: p.description
      }).returning().all()
      insertedPerms[p.code] = perm.id
    }

    const superAdminId = insertedRoles['super_admin']
    for (const [code, permId] of Object.entries(insertedPerms)) {
      tx.insert(rolePermissions).values({
        roleId: superAdminId,
        permissionId: permId
      }).run()
    }
  })

  console.log('[seed-roles] Roles and permissions initialized successfully.')
  console.log(`  Roles: ${SYSTEM_ROLES.length}, Permissions: ${ALL_PERMISSIONS.length}`)
  console.log('  super_admin got all permissions.')
}

ensureRolesAndPermissions()
