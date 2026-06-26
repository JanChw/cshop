import { ref, computed } from 'vue'
import { api } from '../utils/api'

export interface User {
  id: number
  name: string
  email: string
}

export interface LoginData {
  accessToken: string
  refreshToken: string
  user: User
  isStaff: boolean
  roleId: number
  roleName: string
  permissions: string[]
}

const TOKEN_KEYS = ['cshop_admin_token', 'cshop_admin_refresh', 'cshop_admin_user', 'cshop_admin_permissions', 'cshop_admin_role'] as const

function storageGet(key: string): string | null {
  return sessionStorage.getItem(key) || localStorage.getItem(key)
}

function storageSet(key: string, value: string | null, remembered: boolean) {
  const storage = remembered ? localStorage : sessionStorage
  const other = remembered ? sessionStorage : localStorage
  other.removeItem(key)
  if (value !== null) {
    storage.setItem(key, value)
  } else {
    storage.removeItem(key)
  }
}

const token = ref<string | null>(storageGet('cshop_admin_token'))
const refreshToken = ref<string | null>(storageGet('cshop_admin_refresh'))
const user = ref<User | null>(JSON.parse(storageGet('cshop_admin_user') || 'null'))
const permissions = ref<string[]>(JSON.parse(storageGet('cshop_admin_permissions') || '[]'))
const roleName = ref<string | null>(storageGet('cshop_admin_role'))

function persist(remembered = true) {
  storageSet('cshop_admin_token', token.value, remembered)
  storageSet('cshop_admin_refresh', refreshToken.value, remembered)
  storageSet('cshop_admin_user', user.value ? JSON.stringify(user.value) : null, remembered)
  storageSet('cshop_admin_permissions', permissions.value.length ? JSON.stringify(permissions.value) : null, remembered)
  storageSet('cshop_admin_role', roleName.value, remembered)
}

export function useAuth() {
  const isLoggedIn = computed(() => !!token.value && !!user.value)

  function hasPermission(code: string): boolean {
    return permissions.value.includes(code)
  }

  async function login(email: string, password: string, rememberMe = true) {
    const res = await api.post<LoginData>('/auth/login', { email, password, rememberMe })
    if (!res.success || !res.data) {
      return { success: false as const, error: res.error || '登录失败' }
    }
    const d = res.data
    token.value = d.accessToken
    refreshToken.value = d.refreshToken
    user.value = d.user
    permissions.value = d.permissions
    roleName.value = d.roleName
    persist(rememberMe)
    return { success: true as const }
  }

  function logout() {
    token.value = null
    refreshToken.value = null
    user.value = null
    permissions.value = []
    roleName.value = null
    persist(true)
  }

  function getStoredTokens() {
    return {
      token: storageGet('cshop_admin_token'),
      refreshToken: storageGet('cshop_admin_refresh')
    }
  }

  return { isLoggedIn, user, permissions, roleName, login, logout, hasPermission, getStoredTokens, token }
}
