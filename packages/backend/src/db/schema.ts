import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role', { enum: ['customer', 'admin'] }).notNull().default('customer'),
  disabled: integer('disabled', { mode: 'boolean' }).notNull().default(false),
  lastLoginAt: text('last_login_at'),
  emailVerifiedAt: text('email_verified_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
})

export const roles = sqliteTable('roles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
})

export const permissions = sqliteTable('permissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  module: text('module').notNull(),
  description: text('description')
})

export const rolePermissions = sqliteTable('role_permissions', {
  roleId: integer('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  permissionId: integer('permission_id').references(() => permissions.id, { onDelete: 'cascade' }).notNull()
}, (t) => ({
  pk: index('role_permissions_pk').on(t.roleId, t.permissionId)
}))

export const staff = sqliteTable('staff', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  roleId: integer('role_id').references(() => roles.id).notNull(),
  employeeNo: text('employee_no').unique(),
  department: text('department'),
  position: text('position'),
  status: text('status', { enum: ['active', 'suspended', 'resigned'] }).notNull().default('active'),
  hiredAt: text('hired_at'),
  lastLoginAt: text('last_login_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
}, (t) => ({
  roleIdx: index('staff_role_idx').on(t.roleId),
  statusIdx: index('staff_status_idx').on(t.status)
}))

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique()
})

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  basePrice: real('base_price').notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  image: text('image'),
  stock: integer('stock').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
}, (t) => ({
  categoryIdx: index('products_category_idx').on(t.categoryId),
  activeIdx: index('products_active_idx').on(t.isActive)
}))

export const productVariants = sqliteTable('product_variants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  size: text('size').notNull(),
  color: text('color'),
  material: text('material'),
  weight: integer('weight'),
  priceAdjustment: real('price_adjustment').notNull().default(0),
  stock: integer('stock').notNull().default(0)
}, (t) => ({
  productIdx: index('variants_product_idx').on(t.productId)
}))

export const designs = sqliteTable('designs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  variantId: integer('variant_id').references(() => productVariants.id),
  name: text('name').notNull(),
  canvasData: text('canvas_data').notNull(),
  previewImage: text('preview_image'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
}, (t) => ({
  userIdx: index('designs_user_idx').on(t.userId)
}))

export const cartItems = sqliteTable('cart_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  designId: integer('design_id').references(() => designs.id),
  variantId: integer('variant_id').references(() => productVariants.id),
  quantity: integer('quantity').notNull().default(1)
}, (t) => ({
  userIdx: index('cart_user_idx').on(t.userId)
}))

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  status: text('status', { enum: ['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled'] })
    .notNull().default('pending'),
  total: real('total').notNull().default(0),
  address: text('address'),
  paidAt: text('paid_at'),
  shippedAt: text('shipped_at'),
  completedAt: text('completed_at'),
  cancelledAt: text('cancelled_at'),
  trackingNo: text('tracking_no'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
}, (t) => ({
  userIdx: index('orders_user_idx').on(t.userId),
  statusIdx: index('orders_status_idx').on(t.status)
}))

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  designId: integer('design_id').references(() => designs.id),
  variantId: integer('variant_id').references(() => productVariants.id),
  quantity: integer('quantity').notNull().default(1),
  price: real('price').notNull()
}, (t) => ({
  orderIdx: index('order_items_order_idx').on(t.orderId)
}))

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  refreshToken: text('refresh_token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  // null = active; non-null = revoked timestamp (used for replay detection)
  revokedAt: text('revoked_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
}, (t) => ({
  userIdx: index('sessions_user_idx').on(t.userId),
  expiresIdx: index('sessions_expires_idx').on(t.expiresAt)
}))

export const backups = sqliteTable('backups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filename: text('filename').notNull(),
  size: integer('size').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
})

export const uploads = sqliteTable('uploads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  originalName: text('original_name').notNull(),
  baseName: text('base_name').notNull().unique(),
  mimeType: text('mime_type').notNull().default('image/webp'),
  thumbPath: text('thumb_path'),
  smallPath: text('small_path'),
  mediumPath: text('medium_path'),
  largePath: text('large_path'),
  thumbSize: integer('thumb_size'),
  smallSize: integer('small_size'),
  mediumSize: integer('medium_size'),
  largeSize: integer('large_size'),
  width: integer('width'),
  height: integer('height'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
}, (t) => ({
  userIdx: index('uploads_user_idx').on(t.userId)
}))

export const stickers = sqliteTable('stickers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category').notNull().default('general'),
  imagePath: text('image_path').notNull(),
  width: integer('width').notNull().default(200),
  height: integer('height').notNull().default(200),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
}, (t) => ({
  categoryIdx: index('stickers_category_idx').on(t.category)
}))

export const activityEvents = sqliteTable('activity_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  path: text('path').notNull(),
  method: text('method'),
  statusCode: integer('status_code'),
  duration: integer('duration'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  deviceType: text('device_type').notNull().default('desktop'),
  country: text('country'),
  region: text('region'),
  city: text('city'),
  metadata: text('metadata'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
}, (t) => ({
  userIdIdx: index('activity_events_user_idx').on(t.userId),
  eventTypeIdx: index('activity_events_type_idx').on(t.eventType),
  createdAtIdx: index('activity_events_created_idx').on(t.createdAt),
  countryIdx: index('activity_events_country_idx').on(t.country)
}))

export const userOnline = sqliteTable('user_online', {
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  deviceType: text('device_type').notNull().default('desktop'),
  loginAt: text('login_at').notNull(),
  lastActiveAt: text('last_active_at').notNull(),
  ip: text('ip'),
  userAgent: text('user_agent'),
  country: text('country'),
  region: text('region'),
  city: text('city')
}, (t) => ({
  pk: index('user_online_pk').on(t.userId, t.deviceType)
}))

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
})
