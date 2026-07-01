// Test lifecycle preload (runs after env.ts). By the time this module is
// evaluated, env vars are already set so db/index.ts opens the in-memory
// database. We apply migrations once and register a beforeEach hook that
// wipes data between tests.
//
// The hook MUST be registered in a preload (not a shared helper imported
// by tests): bun:test only attaches lifecycle hooks to the module they
// are declared in.

import { beforeEach } from 'bun:test'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { db } from '../../src/db'
import {
  orderItems, cartItems, designs, designDrafts, uploads, sessions,
  orders, productVariants, products, categories,
  stickers, backups, users, activityEvents, activityEventRefs,
  userOnline, settings, staff,
  productImages, dailyStats, productDailyViews
} from '../../src/db/schema'
import { resetQueue } from '../../src/utils/eventQueue'
import { invalidateStaffCache } from '../../src/utils/staff'
import { invalidateCache } from '../../src/utils/cache'
import { reseedRbac } from './rbacSeed'

migrate(db, { migrationsFolder: './drizzle' })
reseedRbac()

const TABLES = [
  staff, sessions,
  orderItems, cartItems, designs, designDrafts, uploads,
  orders, productVariants, products, categories,
  stickers, backups, activityEvents, activityEventRefs,
  userOnline, settings, users,
  productImages, dailyStats, productDailyViews
]

beforeEach(() => {
  resetQueue()
  invalidateStaffCache()
  invalidateCache()
  for (const t of TABLES) {
    db.delete(t).run()
  }
})
