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
                class="rounded-full bg-[#EFF6FF] text-primary text-xs font-medium px-2 h-5 flex items-center"
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
      </div>
    </div>

    <div class="flex-1 flex flex-col p-7 pb-12 min-w-0">
      <div class="flex flex-col gap-1 mb-5">
        <h2 class="text-xl font-semibold text-text-primary">{{ selectedRole?.name }}</h2>
        <p class="text-sm text-text-muted">
          {{ selectedRole?.description }}  |  {{ selectedRole?.identifier }}
        </p>
      </div>

      <div class="h-px bg-border mb-5" />

      <div class="flex-1 overflow-auto">
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
                :key="perm"
                class="flex items-center gap-2"
              >
                <div
                  class="w-[18px] h-[18px] rounded flex items-center justify-center text-xs text-white cursor-pointer transition-colors"
                  :class="isPermChecked(group.title, perm)
                    ? 'bg-primary'
                    : 'bg-gray-200'"
                  @click="togglePerm(group.title, perm)"
                >
                  <span v-if="isPermChecked(group.title, perm)">✓</span>
                </div>
                <span class="text-sm text-text-primary">{{ perm }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end mt-5 pt-3 border-t border-border">
        <button class="rounded bg-primary text-white text-sm font-medium h-10 px-5 hover:bg-primary/90 transition-colors">
          保存
        </button>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="modalVisible"
          class="fixed inset-0 z-50 flex items-center justify-center"
          @click.self="modalVisible = false"
        >
          <div class="absolute inset-0 bg-black/50" />
          <div class="relative bg-white rounded-md w-[480px] border border-border p-7 flex flex-col gap-5">
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
          <div class="relative bg-white rounded-md w-[400px] border border-border p-7 flex flex-col gap-5">
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
import { ref, reactive } from 'vue'
import { Plus, Lock, Trash2, Pencil } from 'lucide-vue-next'

interface Role {
  id: number
  name: string
  identifier: string
  description: string
  permCount: number
  isSystem: boolean
  permissions: Record<string, string[]>
}

const roles = ref<Role[]>([
  { id: 1, name: '超级管理员', identifier: 'super_admin', description: '拥有全部系统权限', permCount: 25, isSystem: true, permissions: { '商品管理': ['创建商品', '查看商品', '更新商品', '删除商品'], '订单管理': ['查看订单', '更新状态'], '用户管理': ['查看用户', '更新用户', '禁用用户'], '员工管理': ['查看员工', '创建员工', '更新员工', '删除员工'], '数据分析': ['查看分析', '导出数据'], '分类管理': ['创建分类', '更新分类', '删除分类'], '贴纸管理': ['创建贴纸', '更新贴纸', '删除贴纸'], '备份管理': ['创建备份', '下载备份', '删除备份'], '设置管理': ['查看设置', '更新设置'] } },
  { id: 2, name: '商品管理员', identifier: 'product_mgr', description: '管理商品、分类和贴纸', permCount: 12, isSystem: true, permissions: { '商品管理': ['创建商品', '查看商品', '更新商品', '删除商品'], '分类管理': ['创建分类', '更新分类', '删除分类'], '贴纸管理': ['创建贴纸', '更新贴纸', '删除贴纸'] } },
  { id: 3, name: '订单管理员', identifier: 'order_mgr', description: '管理订单和查看用户', permCount: 4, isSystem: false, permissions: { '订单管理': ['查看订单', '更新状态'], '用户管理': ['查看用户', '更新用户'] } },
  { id: 4, name: '数据分析员', identifier: 'analytics_viewer', description: '查看数据分析报表', permCount: 3, isSystem: false, permissions: { '数据分析': ['查看分析', '导出数据'] } },
])

const selectedRole = ref<Role>(roles.value[0])

const permRows = [
  [
    { title: '商品管理', perms: ['创建商品', '查看商品', '更新商品', '删除商品'] },
    { title: '订单管理', perms: ['查看订单', '更新状态'] },
    { title: '用户管理', perms: ['查看用户', '更新用户', '禁用用户'] },
  ],
  [
    { title: '员工管理', perms: ['查看员工', '创建员工', '更新员工', '删除员工'] },
    { title: '数据分析', perms: ['查看分析', '导出数据'] },
    { title: '分类管理', perms: ['创建分类', '更新分类', '删除分类'] },
  ],
  [
    { title: '贴纸管理', perms: ['创建贴纸', '更新贴纸', '删除贴纸'] },
    { title: '备份管理', perms: ['创建备份', '下载备份', '删除备份'] },
    { title: '设置管理', perms: ['查看设置', '更新设置'] },
  ],
]

const checkedPerms = reactive<Record<string, string[]>>({
  '商品管理': ['创建商品', '查看商品', '更新商品', '删除商品'],
  '订单管理': ['查看订单', '更新状态'],
  '用户管理': ['查看用户', '更新用户', '禁用用户'],
  '员工管理': ['查看员工', '创建员工', '更新员工', '删除员工'],
  '数据分析': ['查看分析', '导出数据'],
  '分类管理': ['创建分类', '更新分类', '删除分类'],
  '贴纸管理': ['创建贴纸', '更新贴纸', '删除贴纸'],
  '备份管理': ['创建备份', '下载备份', '删除备份'],
  '设置管理': ['查看设置', '更新设置'],
})

function isPermChecked(group: string, perm: string) {
  return checkedPerms[group]?.includes(perm) ?? false
}

function togglePerm(group: string, perm: string) {
  if (!checkedPerms[group]) checkedPerms[group] = []
  const idx = checkedPerms[group].indexOf(perm)
  if (idx >= 0) checkedPerms[group].splice(idx, 1)
  else checkedPerms[group].push(perm)
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

function confirmDelete() {
  if (deletingRole.value) {
    roles.value = roles.value.filter((r) => r.id !== deletingRole.value!.id)
    if (selectedRole.value?.id === deletingRole.value.id) {
      selectedRole.value = roles.value[0] || null
    }
  }
  deleteModalVisible.value = false
  deletingRole.value = null
}

function saveRole() {
  if (!newRole.identifier || !newRole.name) return
  if (editingRole.value) {
    editingRole.value.name = newRole.name
    editingRole.value.description = newRole.description
  } else {
    const maxId = Math.max(...roles.value.map((r) => r.id))
    roles.value.push({
      id: maxId + 1,
      name: newRole.name,
      identifier: newRole.identifier,
      description: newRole.description,
      permCount: 0,
      isSystem: false,
      permissions: {},
    })
  }
  closeModal()
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
