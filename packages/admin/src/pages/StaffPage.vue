<template>
  <div class="p-6 flex flex-col gap-4 min-h-screen">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-text-primary">员工管理</h1>
        <p class="text-sm text-text-muted">管理所有员工账号（含部门/职位/角色）</p>
      </div>
      <button
        v-if="canCreate"
        class="h-10 rounded bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors flex items-center gap-2"
        @click="openAdd"
      >
        <Plus :size="16" />
        新增员工
      </button>
    </div>

    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 w-[280px] h-9 rounded border border-border px-3 bg-white focus-within:border-primary transition-colors">
        <Search :size="16" class="text-text-muted shrink-0" />
        <input
          v-model="searchQuery"
          type="text"
          aria-label="搜索邮箱或姓名"
          placeholder="搜索邮箱或姓名..."
          class="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
        />
      </div>

      <div class="relative">
        <select
          v-model="roleFilter"
          class="h-9 rounded border border-border px-3 pr-8 text-sm text-text-primary bg-white outline-none appearance-none cursor-pointer"
        >
          <option value="">全部角色</option>
          <option
            v-for="r in availableRoles"
            :key="r.name"
            :value="r.name"
          >
            {{ r.displayName }}
          </option>
        </select>
        <ChevronDown :size="16" class="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>

      <div class="relative">
        <select
          v-model="statusFilter"
          class="h-9 rounded border border-border px-3 pr-8 text-sm text-text-primary bg-white outline-none appearance-none cursor-pointer"
        >
          <option value="">全部状态</option>
          <option value="active">在职</option>
          <option value="suspended">停职</option>
          <option value="resigned">已离职</option>
        </select>
        <ChevronDown :size="16" class="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>
    </div>

    <div class="flex-1 bg-card border border-border rounded-md overflow-hidden flex flex-col">
      <div ref="tableBodyRef" class="flex-1 overflow-auto">
        <div class="flex items-center px-4 bg-table-header h-11 shrink-0 sticky top-0 z-10">
          <span class="w-[50px] text-xs font-semibold text-text-muted text-center">ID</span>
          <span class="w-[100px] text-xs font-semibold text-text-muted text-center">姓名</span>
          <span class="w-[140px] text-xs font-semibold text-text-muted text-center">角色</span>
          <span class="w-[100px] text-xs font-semibold text-text-muted text-center">部门</span>
          <span class="w-[100px] text-xs font-semibold text-text-muted text-center">职位</span>
          <span class="w-[200px] text-xs font-semibold text-text-muted text-center">邮箱</span>
          <span class="w-[80px] text-xs font-semibold text-text-muted text-center">状态</span>
          <span class="w-[160px] text-xs font-semibold text-text-muted text-center">入职时间</span>
          <span class="w-[180px] text-xs font-semibold text-text-muted text-center">操作</span>
        </div>
        <div v-if="loading" class="flex items-center justify-center h-40">
          <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <template v-else>
          <div
            v-for="s in paginatedStaff"
            :key="s.id"
            class="flex items-center px-4 h-[52px] border-b border-border"
          >
          <span class="w-[50px] text-sm text-text-muted font-mono text-center">{{ s.id }}</span>
          <span class="w-[100px] text-sm text-text-primary font-medium text-center">{{ s.name }}</span>
          <span class="w-[140px] text-sm text-text-primary text-center">{{ s.roleDisplayName }}</span>
          <span class="w-[100px] text-sm text-text-muted text-center">{{ s.department || '—' }}</span>
          <span class="w-[100px] text-sm text-text-muted text-center">{{ s.position || '—' }}</span>
          <span class="w-[200px] text-xs text-text-muted font-mono text-center">{{ s.email }}</span>
          <span class="w-[80px] text-center">
            <StatusBadge :label="s.statusLabel" :variant="s.status === 'active' ? 'active' : 'inactive'" />
          </span>
          <span class="w-[160px] text-xs text-text-muted font-mono text-center">{{ s.hiredAt }}</span>
          <div class="w-[180px] flex items-center justify-center gap-1">
            <button
              v-if="canUpdate"
              class="rounded p-1 text-text-muted hover:bg-gray-100 transition-colors"
              @mouseenter="showTip('编辑', $event)"
              @mouseleave="hideTip"
              @click="openEdit(s)"
            >
              <Pencil :size="14" />
            </button>
            <button
              v-if="canDelete && s.id !== currentStaffId"
              class="rounded px-2 py-0.5 text-xs font-medium border flex items-center gap-1 transition-colors"
              :class="s.status === 'resigned'
                ? 'text-text-muted border-border bg-gray-50 cursor-not-allowed'
                : 'text-warning border-warning/40 bg-warning/5 hover:bg-warning/10'"
              :disabled="s.status === 'resigned'"
              @mouseenter="!isResignedRow(s) && showTip('设为离职（账号将无法登录，员工记录保留）', $event)"
              @mouseleave="hideTip"
              @click="askResign(s)"
            >
              <LogOut :size="12" />
              离职
            </button>
            <button
              v-if="canDelete && s.id !== currentStaffId"
              class="rounded p-1 text-danger hover:bg-red-50 transition-colors"
              @mouseenter="showTip('永久删除（不可恢复）', $event)"
              @mouseleave="hideTip"
              @click="askHardDelete(s)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
          </div>
        </template>
        <div v-if="!loading && paginatedStaff.length === 0" class="flex items-center justify-center h-40 text-sm text-text-muted">
          暂无员工
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <span class="text-sm text-text-muted">共 {{ total }} 条，每页 8 条</span>
      <div class="flex items-center gap-1">
        <button
          class="w-8 h-8 rounded border border-border bg-white text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <ChevronLeft :size="14" />
        </button>
        <button
          v-for="page in totalPages"
          :key="page"
          class="w-8 h-8 rounded text-sm flex items-center justify-center transition-colors"
          :class="page === currentPage
            ? 'bg-primary text-white'
            : 'bg-white border border-border text-text-primary hover:bg-gray-50'"
          @click="currentPage = page"
        >
          {{ page }}
        </button>
        <button
          class="w-8 h-8 rounded border border-border bg-white text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          <ChevronRight :size="14" />
        </button>
      </div>
    </div>

    <StaffModal
      :visible="modalVisible"
      :staff="editingStaff"
      :available-roles="availableRoles"
      :is-super-admin="isSuperAdmin"
      @close="closeModal"
      @save="handleSave"
    />

    <Teleport to="body">
      <div
        v-if="tip.visible"
        class="fixed z-[9999] px-2 py-1 bg-[#1f2937] text-white text-[11px] leading-tight whitespace-nowrap rounded shadow-lg pointer-events-none"
        :style="{
          top: `${tip.y}px`,
          left: `${tip.x}px`,
          transform: 'translate(-50%, -100%)'
        }"
      >
        {{ tip.text }}
      </div>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="confirmResignVisible"
          class="fixed inset-0 z-50 flex items-center justify-center"
          @click.self="confirmResignVisible = false"
        >
          <div class="absolute inset-0 bg-black/50" />
          <div class="relative glass rounded-md w-[400px] border border-border p-7 flex flex-col gap-5">
            <h3 class="text-base font-semibold text-text-primary">确认设为离职</h3>
            <p class="text-sm text-text-muted">
              确定要将员工
              <span v-if="pendingResign" class="font-medium text-text-primary">{{ pendingResign.name }}</span>
              设为「已离职」吗？该账号将无法登录，但员工记录会保留。
            </p>
            <div class="flex items-center justify-end gap-3">
              <button
                class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
                @click="confirmResignVisible = false"
              >
                取消
              </button>
              <button
                class="h-10 rounded bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
                @click="confirmResign"
              >
                确认离职
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="confirmHardDeleteVisible"
          class="fixed inset-0 z-50 flex items-center justify-center"
          @click.self="confirmHardDeleteVisible = false"
        >
          <div class="absolute inset-0 bg-black/50" />
          <div class="relative glass rounded-md w-[440px] border border-border p-7 flex flex-col gap-5">
            <h3 class="text-base font-semibold text-danger">永久删除员工</h3>
            <p class="text-sm text-text-muted">
              确定要永久删除员工
              <span v-if="pendingHardDelete" class="font-medium text-text-primary">{{ pendingHardDelete.name }}</span>
              吗？此操作不可撤销，账号、人事记录将一并删除。如该员工有订单记录则无法删除。
            </p>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-text-muted">
                请输入 <strong class="text-text-primary">确认删除</strong> 以继续
              </label>
              <input
                v-model="hardDeleteConfirmText"
                type="text"
                placeholder="确认删除"
                class="h-10 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
              />
            </div>
            <div class="flex items-center justify-end gap-3">
              <button
                class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
                @click="confirmHardDeleteVisible = false"
              >
                取消
              </button>
              <button
                class="h-10 rounded bg-danger px-4 text-sm font-medium text-white hover:bg-danger/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="hardDeleteConfirmText !== '确认删除'"
                @click="confirmHardDelete"
              >
                永久删除
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { Search, ChevronDown, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, LogOut } from 'lucide-vue-next'
import gsap from 'gsap'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StaffModal, { type StaffRow, type Role, type CreateStaffPayload, type UpdateStaffPayload } from '@/components/StaffModal.vue'
import { api } from '@/utils/api'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'

const auth = useAuth()
const toast = useToast()

const STATUS_LABELS: Record<string, string> = {
  active: '在职',
  suspended: '停职',
  resigned: '已离职'
}

const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const staffList = ref<StaffRow[]>([])
const total = ref(0)
const loading = ref(false)
const availableRoles = ref<Role[]>([])
const modalVisible = ref(false)
const editingStaff = ref<StaffRow | null>(null)
const confirmResignVisible = ref(false)
const pendingResign = ref<StaffRow | null>(null)
const confirmHardDeleteVisible = ref(false)
const pendingHardDelete = ref<StaffRow | null>(null)
const hardDeleteConfirmText = ref('')
const currentUserId = ref<number>(0)
const currentStaffId = ref<number>(0)

const tip = reactive({ visible: false, text: '', x: 0, y: 0 })

function isResignedRow(s: StaffRow) {
  return s.status === 'resigned'
}

function showTip(text: string, e: MouseEvent) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  tip.text = text
  tip.x = rect.left + rect.width / 2
  tip.y = rect.top - 6
  tip.visible = true
}

function hideTip() {
  tip.visible = false
}

const canCreate = computed(() => auth.hasPermission('staff.create'))
const canUpdate = computed(() => auth.hasPermission('staff.update'))
const canDelete = computed(() => auth.hasPermission('staff.delete'))
const isSuperAdmin = computed(() => auth.roleName.value === 'super_admin')

async function fetchCurrentUser() {
  const res = await api.get<{ id: number }>('/auth/me')
  if (res.success && res.data) {
    currentUserId.value = res.data.id
  }
}

async function fetchRoles() {
  const res = await api.get<{ items: Role[] }>('/admin/roles')
  if (res.success && res.data) {
    availableRoles.value = res.data.items
  }
}

async function fetchStaff() {
  loading.value = true
  const res = await api.get<{
    items: Array<{
      id: number
      userId: number
      roleId: number
      roleName: string
      roleDisplayName: string
      employeeNo: string | null
      department: string | null
      position: string | null
      status: 'active' | 'suspended' | 'resigned'
      hiredAt: string | null
      lastLoginAt: string | null
      createdAt: string
      email: string
      name: string
    }>
    total: number
  }>('/admin/staff', {
    page: currentPage.value,
    limit: 8,
    q: searchQuery.value || '',
    role: roleFilter.value || '',
    status: statusFilter.value || '',
  })
  if (res.success && res.data) {
    const items = (res.data.items || []).map((item) => ({
      id: item.id,
      userId: item.userId,
      roleId: item.roleId,
      roleName: item.roleName,
      roleDisplayName: item.roleDisplayName,
      employeeNo: item.employeeNo,
      department: item.department,
      position: item.position,
      status: item.status,
      statusLabel: STATUS_LABELS[item.status] ?? item.status,
      hiredAt: (item.hiredAt || '').replace('T', ' ').slice(0, 19),
      email: item.email,
      name: item.name,
    }))
    staffList.value = items
    total.value = res.data.total
    const self = items.find((s) => s.userId === currentUserId.value)
    if (self) currentStaffId.value = self.id
  }
  loading.value = false
  nextTick(() => {
    const rows = tableBodyRef.value?.querySelectorAll('.border-b')
    if (rows?.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.from(rows, { opacity: 0, duration: 0.2, stagger: 0.02, ease: 'power2.out' })
    }
  })
}

function openAdd() {
  editingStaff.value = null
  modalVisible.value = true
}

function openEdit(s: StaffRow) {
  editingStaff.value = s
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
  editingStaff.value = null
}

async function handleSave(data: CreateStaffPayload | UpdateStaffPayload) {
  if (editingStaff.value) {
    const res = await api.put(`/admin/staff/${editingStaff.value.id}`, data)
    if (!res.success) {
      toast.error(res.error || '保存失败')
      return
    }
    toast.success('保存成功')
  } else {
    const res = await api.post<{ id: number }>('/admin/staff', data)
    if (!res.success) {
      toast.error(res.error || '创建失败')
      return
    }
    toast.success('员工已创建')
  }
  closeModal()
  await fetchStaff()
}

function askResign(s: StaffRow) {
  pendingResign.value = s
  confirmResignVisible.value = true
}

async function confirmResign() {
  if (!pendingResign.value) return
  const res = await api.post(`/admin/staff/${pendingResign.value.id}/resign`)
  confirmResignVisible.value = false
  if (!res.success) {
    toast.error(res.error || '操作失败')
    return
  }
  toast.success('已设为离职')
  pendingResign.value = null
  await fetchStaff()
}

function askHardDelete(s: StaffRow) {
  pendingHardDelete.value = s
  hardDeleteConfirmText.value = ''
  confirmHardDeleteVisible.value = true
}

async function confirmHardDelete() {
  if (!pendingHardDelete.value) return
  if (hardDeleteConfirmText.value !== '确认删除') return
  const res = await api.delete<{ hardDeleted: boolean }>(`/admin/staff/${pendingHardDelete.value.id}`)
  confirmHardDeleteVisible.value = false
  if (!res.success) {
    toast.error(res.error || '操作失败')
    return
  }
  toast.success('已永久删除')
  pendingHardDelete.value = null
  await fetchStaff()
}

const totalPages = computed(() => Math.ceil(total.value / 8) || 1)
const paginatedStaff = computed(() => staffList.value)
const tableBodyRef = ref<HTMLElement | null>(null)

watch([searchQuery, roleFilter, statusFilter], () => {
  if (currentPage.value !== 1) {
    currentPage.value = 1
  } else {
    fetchStaff()
  }
})

watch(currentPage, fetchStaff)

onMounted(async () => {
  await fetchCurrentUser()
  await fetchRoles()
  await fetchStaff()
})
</script>

