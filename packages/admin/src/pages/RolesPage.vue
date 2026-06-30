<template>
  <div class="flex min-h-screen">
    <div class="w-[360px] bg-card border-r border-border flex flex-col py-5 px-4 shrink-0">
      <div class="flex items-center justify-between mb-4">
        <span class="text-base font-semibold text-text-primary">角色列表</span>
        <button
          class="rounded bg-primary text-white text-xs font-medium h-8 px-3 flex items-center gap-1 hover:bg-primary/90 transition-colors"
          @click="openAddModal"
        >
          <Plus :size="14" />
          新增角色
        </button>
      </div>

      <div class="flex flex-col gap-4 flex-1 overflow-auto">
        <div v-if="loading" class="flex items-center justify-center h-40">
          <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <template v-else>
          <div
            v-for="role in roles"
            :key="role.id"
            class="rounded-md p-4 flex flex-col gap-1.5 cursor-pointer transition-colors"
            :class="selectedRole?.id === role.id
              ? 'border-2 border-primary bg-white'
              : 'border border-border bg-white hover:border-gray-300'"
            @click="selectedRole = role"
          >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="text-sm font-semibold text-text-primary">{{ role.name }}</span>
              <span
                v-if="role.isSystem"
                class="rounded-full bg-info-light text-primary text-xs font-medium px-2 h-5 flex items-center"
              >
                系统
              </span>
            </div>
            <div class="flex items-center gap-1">
              <Lock v-if="role.identifier === 'super_admin'" :size="14" class="text-gray-300" />
              <template v-else>
                <button
                  class="rounded w-6 h-6 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                  @click.stop="openEditModal(role)"
                >
                  <Pencil :size="14" />
                </button>
                <button
                  class="rounded w-6 h-6 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                  @click.stop="openDeleteModal(role)"
                >
                  <Trash2 :size="14" />
                </button>
              </template>
            </div>
          </div>
          <span class="text-xs text-text-muted font-mono">{{ role.identifier }}</span>
          <span class="text-xs text-text-muted">{{ role.description }}</span>
          <span class="text-xs font-medium text-primary">{{ role.permCount }} 项权限</span>
          </div>
        </template>
      </div>
    </div>

    <div class="flex-1 flex flex-col p-7 pb-12 min-w-0">
      <Transition name="tab-panel" mode="out-in">
        <div :key="selectedRole?.id ?? 0" class="flex flex-col gap-0 min-w-0 min-h-0 flex-1">
          <div class="flex flex-col gap-1 mb-5">
            <h2 class="text-base font-semibold text-text-primary">{{ selectedRole?.name }}</h2>
            <p class="text-sm text-text-muted">
              {{ selectedRole?.description }}  |  {{ selectedRole?.identifier }}
            </p>
          </div>

          <div class="h-px bg-border mb-5" />

          <div ref="permContainerRef" class="flex-1 overflow-auto">
            <div class="flex flex-col gap-4">
              <div v-for="(row, ri) in permRows" :key="ri" class="flex gap-4">
                <div
                  v-for="group in row"
                  :key="group.title"
                  class="flex-1 border border-border rounded-md p-4 flex flex-col gap-3"
                >
                  <span class="text-sm font-semibold text-text-primary">{{ group.title }}</span>
                  <div
                    v-for="perm in group.perms"
                    :key="perm.code"
                    class="flex items-center gap-2"
                  >
                    <div
                      class="w-[18px] h-[18px] rounded flex items-center justify-center text-xs text-white cursor-pointer transition-colors"
                      :class="isPermChecked(group.title, perm.code)
                        ? 'bg-primary'
                        : 'bg-gray-200'"
                      @click="togglePerm(group.title, perm.code)"
                    >
                      <span v-if="isPermChecked(group.title, perm.code)">✓</span>
                    </div>
                    <span class="text-sm text-text-primary">{{ perm.description }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end mt-5 pt-3 border-t border-border">
            <button
              class="rounded bg-primary text-white text-sm font-medium h-10 px-5 hover:bg-primary/90 transition-colors"
              @click="savePermissions"
            >
              保存
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="modalVisible"
          class="fixed inset-0 z-50 flex items-center justify-center"
          @click.self="modalVisible = false"
        >
          <div class="absolute inset-0 bg-black/50" />
          <div class="relative glass rounded-md w-[480px] border border-border p-7 flex flex-col gap-5">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-text-primary">{{ editingRole ? '编辑角色' : '新增角色' }}</h3>
              <button
                class="w-8 h-8 rounded flex items-center justify-center text-text-primary hover:bg-gray-100 transition-colors"
                @click="closeModal"
              >
                ×
              </button>
            </div>

            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-text-primary">角色标识 *</label>
                <input
                  v-model="newRole.identifier"
                  type="text"
                  class="h-10 rounded border border-border px-3 text-sm text-text-primary outline-none focus:border-primary transition-colors"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-text-primary">显示名称 *</label>
                <input
                  v-model="newRole.name"
                  type="text"
                  class="h-10 rounded border border-border px-3 text-sm text-text-primary outline-none focus:border-primary transition-colors"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-text-primary">角色描述</label>
                <input
                  v-model="newRole.description"
                  type="text"
                  class="h-10 rounded border border-border px-3 text-sm text-text-primary outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-3">
              <button
                class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
                @click="closeModal"
              >
                取消
              </button>
              <button
                class="h-10 rounded bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
                @click="saveRole"
              >
                {{ editingRole ? '保存修改' : '创建角色' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="modal">
        <div
          v-if="deleteModalVisible"
          class="fixed inset-0 z-50 flex items-center justify-center"
          @click.self="deleteModalVisible = false"
        >
          <div class="absolute inset-0 bg-black/50" />
          <div class="relative glass rounded-md w-[400px] border border-border p-7 flex flex-col gap-5">
            <h3 class="text-base font-semibold text-text-primary">确认删除</h3>
            <p class="text-sm text-text-muted">
              确定要删除角色
              <span v-if="deletingRole" class="font-medium text-text-primary">
                {{ deletingRole.name }}
              </span>
              吗？此操作不可撤销。
            </p>
            <div class="flex items-center justify-end gap-3">
              <button
                class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
                @click="deleteModalVisible = false"
              >
                取消
              </button>
              <button
                class="h-10 rounded bg-danger px-4 text-sm font-medium text-white hover:bg-danger/90 transition-colors"
                @click="confirmDelete"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick, onMounted } from 'vue'
import { Plus, Lock, Trash2, Pencil } from 'lucide-vue-next'
import { api } from '@/utils/api'
import { useToast } from '@/composables/useToast'
import gsap from 'gsap'

interface Permission {
  id: number
  code: string
  module: string
  description: string
}

interface Role {
  id: number
  name: string
  identifier: string
  description: string
  permCount: number
  isSystem: boolean
  permissions: Permission[]
}

const MODULE_TO_TITLE: Record<string, string> = {
  product: '商品管理',
  order: '订单管理',
  user: '用户管理',
  staff: '员工管理',
  analytics: '数据分析',
  category: '分类管理',
  sticker: '贴纸管理',
  backup: '备份管理',
  settings: '设置管理',
  menu: '菜单管理',
  inventory: '库存管理',
  'home-sections': '首页配置',
  'design-configs': '设计配置',
}

const GROUP_ORDER = Object.values(MODULE_TO_TITLE)

const { success: toastSuccess, error: toastError } = useToast()

const roles = ref<Role[]>([])
const selectedRole = ref<Role | null>(null)
const permContainerRef = ref<HTMLElement | null>(null)
const loading = ref(true)

const permCodeToId: Record<string, number> = {}

const permRows = ref<Array<Array<{ title: string; perms: Permission[] }>>>([])

const checkedPerms = reactive<Record<string, string[]>>({})

watch(selectedRole, () => {
  if (selectedRole.value) {
    populateCheckedPerms(selectedRole.value)
  }
  nextTick(() => {
    const cards = permContainerRef.value?.querySelectorAll('.border.rounded-md.p-4')
    if (cards?.length) {
      gsap.fromTo(cards, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' })
    }
  })
})

async function fetchRoles() {
  const res = await api.get<{ items: Array<{ id: number; name: string; displayName: string; description: string; isSystem: boolean; permissions: Permission[] }> }>('/admin/roles')
  if (res.success && res.data) {
    roles.value = res.data.items.map((r) => ({
      id: r.id,
      name: r.displayName,
      identifier: r.name,
      description: r.description,
      isSystem: r.isSystem,
      permissions: r.permissions,
      permCount: r.permissions.length,
    }))
  }
}

async function fetchPermissions() {
  const res = await api.get<{ items: Permission[] }>('/admin/roles/permissions')
  if (res.success && res.data) {
    for (const perm of res.data.items) {
      permCodeToId[perm.code] = perm.id
    }
    const groups: Record<string, Permission[]> = {}
    for (const perm of res.data.items) {
      const title = MODULE_TO_TITLE[perm.module]
      if (title) {
        if (!groups[title]) groups[title] = []
        groups[title].push(perm)
      }
    }
    const rows: Array<Array<{ title: string; perms: Permission[] }>> = []
    const existing = GROUP_ORDER.filter((t) => groups[t])
    for (let i = 0; i < existing.length; i += 3) {
      rows.push(existing.slice(i, i + 3).map((title) => ({ title, perms: groups[title] })))
    }
    permRows.value = rows
  }
}

onMounted(async () => {
  loading.value = true
  await Promise.all([fetchRoles(), fetchPermissions()])
  loading.value = false
  if (!selectedRole.value && roles.value.length > 0) {
    selectedRole.value = roles.value[0]
  }
})

function populateCheckedPerms(role: Role) {
  for (const key of Object.keys(checkedPerms)) {
    checkedPerms[key] = []
  }
  for (const perm of role.permissions) {
    const title = MODULE_TO_TITLE[perm.module]
    if (title) {
      if (!checkedPerms[title]) checkedPerms[title] = []
      checkedPerms[title].push(perm.code)
    }
  }
}

function isPermChecked(group: string, perm: string) {
  return checkedPerms[group]?.includes(perm) ?? false
}

function togglePerm(group: string, perm: string) {
  if (!checkedPerms[group]) checkedPerms[group] = []
  const idx = checkedPerms[group].indexOf(perm)
  if (idx >= 0) checkedPerms[group].splice(idx, 1)
  else checkedPerms[group].push(perm)
}

async function savePermissions() {
  if (!selectedRole.value) return
  const ids: number[] = []
  for (const perms of Object.values(checkedPerms)) {
    for (const code of perms) {
      const id = permCodeToId[code]
      if (id !== undefined) ids.push(id)
    }
  }
  const res = await api.put(`/admin/roles/${selectedRole.value.id}/permissions`, { permissionIds: ids })
  if (res.success) {
    toastSuccess('权限保存成功')
    await fetchRoles()
    const found = roles.value.find((r) => r.id === selectedRole.value!.id)
    if (found) selectedRole.value = found
    else selectedRole.value = roles.value[0] || null
  } else {
    toastError(res.error || '保存失败')
  }
}

const modalVisible = ref(false)
const deleteModalVisible = ref(false)
const deletingRole = ref<Role | null>(null)
const newRole = reactive({ identifier: '', name: '', description: '' })
const editingRole = ref<Role | null>(null)

function openAddModal() {
  editingRole.value = null
  newRole.identifier = ''
  newRole.name = ''
  newRole.description = ''
  modalVisible.value = true
}

function openEditModal(role: Role) {
  editingRole.value = role
  newRole.identifier = role.identifier
  newRole.name = role.name
  newRole.description = role.description
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
  editingRole.value = null
}

function openDeleteModal(role: Role) {
  deletingRole.value = role
  deleteModalVisible.value = true
}

async function confirmDelete() {
  if (!deletingRole.value) return
  const res = await api.delete(`/admin/roles/${deletingRole.value.id}`)
  if (!res.success) {
    toastError(res.error || '删除失败')
    return
  }
  roles.value = roles.value.filter((r) => r.id !== deletingRole.value!.id)
  if (selectedRole.value?.id === deletingRole.value.id) {
    selectedRole.value = roles.value[0] || null
  }
  deleteModalVisible.value = false
  deletingRole.value = null
  toastSuccess('角色已删除')
}

async function saveRole() {
  if (!newRole.identifier || !newRole.name) return
  if (editingRole.value) {
    editingRole.value.name = newRole.name
    editingRole.value.identifier = newRole.identifier
    editingRole.value.description = newRole.description
    closeModal()
    toastSuccess('角色已更新')
  } else {
    const res = await api.post<{ id: number }>('/admin/roles', {
      name: newRole.identifier,
      displayName: newRole.name,
      description: newRole.description,
    })
    if (!res.success) {
      toastError(res.error || '创建失败')
      return
    }
    closeModal()
    toastSuccess('角色已创建')
    await fetchRoles()
    if (res.data?.id) {
      selectedRole.value = roles.value.find((r) => r.id === res.data!.id) || roles.value[0]
    }
  }
}
</script>

<style scoped>
.modal-enter-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.modal-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.modal-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}
.modal-leave-to {
  opacity: 0;
  transform: scale(0.98) translateY(-4px);
}
.tab-panel-enter-active,
.tab-panel-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.tab-panel-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.tab-panel-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
