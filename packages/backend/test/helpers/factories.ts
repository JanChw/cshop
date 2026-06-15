import { db } from '../../src/db'
import { users, products, productVariants, cartItems, sessions, categories, staff, roles } from '../../src/db/schema'
import { signAccessToken, signRefreshToken } from '../../src/utils/jwt'
import { loadStaffContext } from '../../src/utils/staff'
import { eq } from 'drizzle-orm'

export interface TestUser {
  id: number
  email: string
  name: string
  accessToken: string
  refreshToken: string
  isStaff?: boolean
  roleId?: number | null
  roleName?: string | null
  permissions?: string[]
}

let userCounter = 0

async function buildToken(userId: number): Promise<{
  accessToken: string
  refreshToken: string
  isStaff: boolean
  roleId: number | null
  roleName: string | null
  permissions: string[]
}> {
  const staffCtx = await loadStaffContext(userId)
  const accessToken = signAccessToken({
    userId,
    isStaff: staffCtx.isStaff,
    roleId: staffCtx.roleId,
    roleName: staffCtx.roleName,
    permissions: staffCtx.permissions
  })
  const refreshToken = signRefreshToken({ userId })
  return {
    accessToken,
    refreshToken,
    isStaff: staffCtx.isStaff,
    roleId: staffCtx.roleId,
    roleName: staffCtx.roleName,
    permissions: staffCtx.permissions
  }
}

export async function createUser(overrides: Partial<{ email: string; name: string; password: string }> = {}): Promise<TestUser> {
  userCounter++
  const email = overrides.email ?? `user${userCounter}@test.local`
  const name = overrides.name ?? `User ${userCounter}`
  const password = overrides.password ?? 'password123'

  const passwordHash = await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 4 })
  const [user] = await db.insert(users).values({ email, passwordHash, name }).returning()

  const tokens = await buildToken(user.id)
  await db.insert(sessions).values({
    userId: user.id,
    refreshToken: tokens.refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
  })

  return {
    id: user.id,
    email,
    name,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    isStaff: tokens.isStaff,
    roleId: tokens.roleId,
    roleName: tokens.roleName,
    permissions: tokens.permissions
  }
}

export async function createStaff(opts: {
  roleName?: 'super_admin' | 'product_mgr' | 'order_mgr' | 'analytics_viewer'
  email?: string
  name?: string
  password?: string
  status?: 'active' | 'suspended' | 'resigned'
} = {}): Promise<TestUser & { staffId: number; roleId: number }> {
  const roleName = opts.roleName ?? 'product_mgr'
  const [role] = db.select().from(roles).where(eq(roles.name, roleName)).limit(1).all()
  if (!role) throw new Error(`Role ${roleName} not found`)

  userCounter++
  const email = opts.email ?? `staff${userCounter}@test.local`
  const name = opts.name ?? `Staff ${userCounter}`
  const password = opts.password ?? 'password123'

  const passwordHash = await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 4 })
  const [user] = await db.insert(users).values({ email, passwordHash, name }).returning()

  const [staffRow] = db.insert(staff).values({
    userId: user.id,
    roleId: role.id,
    status: opts.status ?? 'active',
    hiredAt: new Date().toISOString()
  }).returning().all()

  const tokens = await buildToken(user.id)
  await db.insert(sessions).values({
    userId: user.id,
    refreshToken: tokens.refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
  })

  return {
    id: user.id,
    email,
    name,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    isStaff: tokens.isStaff,
    roleId: tokens.roleId,
    roleName: tokens.roleName,
    permissions: tokens.permissions,
    staffId: staffRow.id,
    roleId: role.id
  } as TestUser & { staffId: number; roleId: number }
}

export async function createCategory(name = 'Tees', slug = 'tees'): Promise<{ id: number }> {
  const [c] = await db.insert(categories).values({ name, slug }).returning()
  return { id: c.id }
}

export async function createProduct(overrides: Partial<{
  name: string
  basePrice: number
  stock: number
  isActive: boolean
  categoryId: number | null
}> = {}): Promise<{ id: number; name: string; basePrice: number; stock: number }> {
  const [p] = await db.insert(products).values({
    name: overrides.name ?? 'T-Shirt',
    basePrice: overrides.basePrice ?? 100,
    stock: overrides.stock ?? 10,
    isActive: overrides.isActive ?? true,
    categoryId: overrides.categoryId ?? null
  }).returning()
  return { id: p.id, name: p.name, basePrice: p.basePrice, stock: p.stock }
}

export async function createVariant(productId: number, overrides: Partial<{
  size: string
  color: string
  priceAdjustment: number
  stock: number
}> = {}): Promise<{ id: number; stock: number }> {
  const [v] = await db.insert(productVariants).values({
    productId,
    size: overrides.size ?? 'M',
    color: overrides.color ?? 'black',
    priceAdjustment: overrides.priceAdjustment ?? 0,
    stock: overrides.stock ?? 5
  }).returning()
  return { id: v.id, stock: v.stock }
}

export async function addCartItem(userId: number, productId: number, opts: { variantId?: number | null; designId?: number | null; quantity?: number } = {}): Promise<{ id: number }> {
  const [c] = await db.insert(cartItems).values({
    userId,
    productId,
    variantId: opts.variantId ?? null,
    designId: opts.designId ?? null,
    quantity: opts.quantity ?? 1
  }).returning()
  return { id: c.id }
}
