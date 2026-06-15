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

const token = ref<string | null>(localStorage.getItem('cshop_admin_token'))
const refreshToken = ref<string | null>(localStorage.getItem('cshop_admin_refresh'))
const user = ref<User | null>(JSON.parse(localStorage.getItem('cshop_admin_user') || 'null'))
const permissions = ref<string[]>(JSON.parse(localStorage.getItem('cshop_admin_permissions') || '[]'))
const roleName = ref<string | null>(localStorage.getItem('cshop_admin_role'))

function persist() {
  if (token.value) {
    localStorage.setItem('cshop_admin_token', token.value)
  } else {
    localStorage.removeItem('cshop_admin_token')
  }
  if (refreshToken.value) {
    localStorage.setItem('cshop_admin_refresh', refreshToken.value)
  } else {
    localStorage.removeItem('cshop_admin_refresh')
  }
  if (user.value) {
    localStorage.setItem('cshop_admin_user', JSON.stringify(user.value))
  } else {
    localStorage.removeItem('cshop_admin_user')
  }
  if (permissions.value.length) {
    localStorage.setItem('cshop_admin_permissions', JSON.stringify(permissions.value))
  } else {
    localStorage.removeItem('cshop_admin_permissions')
  }
  if (roleName.value) {
    localStorage.setItem('cshop_admin_role', roleName.value)
  } else {
    localStorage.removeItem('cshop_admin_role')
  }
}

export function useAuth() {
  const isLoggedIn = computed(() => !!token.value && !!user.value)

  function hasPermission(code: string): boolean {
    return permissions.value.includes(code)
  }

  async function login(email: string, password: string) {
    const res = await api.post<LoginData>('/auth/login', { email, password })
    if (!res.success || !res.data) {
      return { success: false as const, error: res.error || '登录失败' }
    }
    const d = res.data
    token.value = d.accessToken
    refreshToken.value = d.refreshToken
    user.value = d.user
    permissions.value = d.permissions
    roleName.value = d.roleName
    persist()
    return { success: true as const }
  }

  function logout() {
    token.value = null
    refreshToken.value = null
    user.value = null
    permissions.value = []
    roleName.value = null
    persist()
  }

  function getStoredTokens() {
    return {
      token: localStorage.getItem('cshop_admin_token'),
      refreshToken: localStorage.getItem('cshop_admin_refresh')
    }
  }

  return { isLoggedIn, user, permissions, roleName, login, logout, hasPermission, getStoredTokens, token }
}
