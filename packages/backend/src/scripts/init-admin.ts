import { db } from '../db'
import { users, staff, roles } from '../db/schema'
import { eq } from 'drizzle-orm'

interface CliArgs {
  email: string
  password: string
  name: string
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  if (args.length < 2) {
    console.error('Usage: bun src/scripts/init-admin.ts <email> <password> [name]')
    console.error('Or set INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD env vars')
    process.exit(1)
  }
  return {
    email: args[0],
    password: args[1],
    name: args[2] ?? 'Administrator'
  }
}

async function main() {
  const { email, password, name } = parseArgs()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('[init-admin] Invalid email format')
    process.exit(1)
  }
  if (password.length < 6) {
    console.error('[init-admin] Password must be at least 6 characters')
    process.exit(1)
  }

  const [superAdminRole] = db.select().from(roles).where(eq(roles.name, 'super_admin')).limit(1).all()
  if (!superAdminRole) {
    console.error('[init-admin] super_admin role not found. Run migrations first.')
    process.exit(1)
  }

  const [existing] = db.select().from(users).where(eq(users.email, email)).limit(1).all()
  if (existing) {
    const [existingStaff] = db.select().from(staff).where(eq(staff.userId, existing.id)).limit(1).all()
    if (existingStaff) {
      console.log(`[init-admin] User ${email} is already a staff member.`)
      return
    }
    db.transaction((tx) => {
      tx.insert(staff).values({
        userId: existing.id,
        roleId: superAdminRole.id,
        status: 'active',
        hiredAt: new Date().toISOString()
      }).run()
    })
    console.log(`[init-admin] Promoted existing user ${email} to super_admin`)
    return
  }

  const passwordHash = await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 })
  const now = new Date().toISOString()

  const result = db.transaction((tx) => {
    const [user] = tx.insert(users).values({
      email,
      passwordHash,
      name
    }).returning().all()

    const [s] = tx.insert(staff).values({
      userId: user.id,
      roleId: superAdminRole.id,
      status: 'active',
      hiredAt: now
    }).returning().all()

    return { user, staff: s }
  })

  console.log(`[init-admin] Created super admin:`)
  console.log(`  ID: ${result.user.id}`)
  console.log(`  Email: ${result.user.email}`)
  console.log(`  Name: ${result.user.name}`)
  console.log(`  Staff ID: ${result.staff.id}`)
  console.log(`\nYou can now log in with these credentials.`)
}

main().catch(err => {
  console.error('[init-admin] Error:', err)
  process.exit(1)
})
