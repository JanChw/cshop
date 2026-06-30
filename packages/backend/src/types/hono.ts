import type { PermissionCode } from '../utils/permissions'

export type AppEnv = {
  Variables: {
    userId: number
    isStaff: boolean
    roleId: number | null
    roleName: string | null
    permissions: PermissionCode[]
    requestId: string
  }
}
