import { db } from '../db'
import { users, loginAttempts } from '../db/schema'
import { eq } from 'drizzle-orm'
import { getBool, getInt } from './settings'

export interface LockoutState {
  locked: boolean
  remainingMs: number
}

export function checkLockout(email: string): LockoutState {
  const [user] = db.select({ id: users.id, lockedUntil: users.lockedUntil })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .all()
  if (!user?.lockedUntil) return { locked: false, remainingMs: 0 }
  const until = new Date(user.lockedUntil).getTime()
  const now = Date.now()
  if (until > now) {
    return { locked: true, remainingMs: until - now }
  }
  db.update(users)
    .set({ lockedUntil: null, failedAttempts: 0 })
    .where(eq(users.id, user.id))
    .run()
  return { locked: false, remainingMs: 0 }
}

function recordAttempt(email: string, ip: string | null, success: boolean, userAgent: string | null): void {
  db.insert(loginAttempts).values({ email, ip, success, userAgent }).run()
}

export interface FailureResult {
  locked: boolean
  remainingAttempts: number
  lockMinutes: number
}

export function recordFailure(email: string, ip: string | null, userAgent: string | null): FailureResult {
  recordAttempt(email, ip, false, userAgent)

  if (!getBool('login_lock', true)) {
    return { locked: false, remainingAttempts: 999, lockMinutes: 0 }
  }

  const maxAttempts = Math.max(1, getInt('login_max_attempts', 5))
  const lockMinutes = Math.max(1, getInt('login_lock_minutes', 30))

  const [user] = db.select({ id: users.id, failedAttempts: users.failedAttempts })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .all()
  if (!user) return { locked: false, remainingAttempts: maxAttempts, lockMinutes }

  const newCount = (user.failedAttempts ?? 0) + 1
  if (newCount >= maxAttempts) {
    const until = new Date(Date.now() + lockMinutes * 60_000).toISOString()
    db.update(users)
      .set({ failedAttempts: newCount, lockedUntil: until })
      .where(eq(users.id, user.id))
      .run()
    return { locked: true, remainingAttempts: 0, lockMinutes }
  }

  db.update(users)
    .set({ failedAttempts: newCount })
    .where(eq(users.id, user.id))
    .run()
  return { locked: false, remainingAttempts: maxAttempts - newCount, lockMinutes }
}

export function recordSuccess(email: string, ip: string | null, userAgent: string | null): void {
  recordAttempt(email, ip, true, userAgent)
  db.update(users)
    .set({ failedAttempts: 0, lockedUntil: null })
    .where(eq(users.email, email))
    .run()
}

export function formatLockMessage(lockMinutes: number): string {
  return `连续登录失败次数过多，账号已被锁定 ${lockMinutes} 分钟`
}

export function formatRemainingMessage(remaining: number): string {
  return `邮箱或密码错误，剩余 ${remaining} 次尝试机会`
}

export function formatLockedWaitMessage(remainingMs: number): string {
  const minutes = Math.max(1, Math.ceil(remainingMs / 60_000))
  return `账号已被锁定，请于 ${minutes} 分钟后重试`
}
