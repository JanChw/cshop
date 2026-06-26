<template>
  <div class="p-6 flex flex-col gap-4 min-h-screen">
    <div>
      <h1 class="text-xl font-bold text-text-primary">用户管理</h1>
      <p class="text-sm text-text-muted">管理所有注册顾客（员工账号请在「员工管理」中处理）</p>
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
          v-model="statusFilter"
          class="h-9 rounded border border-border px-3 pr-8 text-sm text-text-primary bg-white outline-none appearance-none cursor-pointer"
        >
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="disabled">已禁用</option>
          <option value="deactivated">已注销</option>
        </select>
        <ChevronDown :size="16" class="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>
    </div>

    <div class="flex-1 bg-card border border-border rounded-md overflow-hidden flex flex-col">
      <div ref="tableBodyRef" class="flex-1 overflow-auto">
        <div class="flex items-center px-4 bg-table-header h-11 shrink-0 sticky top-0 z-10">
          <span class="w-[50px] text-xs font-semibold text-text-muted text-center">ID</span>
          <span class="w-[140px] text-xs font-semibold text-text-muted text-center">姓名</span>
          <span class="flex-1 text-xs font-semibold text-text-muted text-center">邮箱</span>
          <span class="w-[100px] text-xs font-semibold text-text-muted text-center">订单数</span>
          <span class="w-[100px] text-xs font-semibold text-text-muted text-center">状态</span>
          <span class="w-[180px] text-xs font-semibold text-text-muted text-center">注册时间</span>
          <span class="w-[100px] text-xs font-semibold text-text-muted text-center">操作</span>
        </div>
        <div v-if="loading" class="flex items-center justify-center h-40">
          <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <template v-else>
          <div
            v-for="user in paginatedUsers"
            :key="user.id"
            class="flex items-center px-4 h-[52px] border-b border-border"
          >
          <span class="w-[50px] text-sm text-text-primary text-center">{{ user.id }}</span>
          <span class="w-[140px] text-sm text-text-primary font-medium text-center">{{ user.name }}</span>
          <span class="flex-1 text-sm text-text-primary text-center font-mono">{{ user.email }}</span>
          <span class="w-[100px] text-sm text-text-muted text-center">{{ user.orderCount }}</span>
          <span class="w-[100px] text-center">
            <StatusBadge :label="user.statusLabel" :variant="user.status === 'active' ? 'active' : 'inactive'" />
          </span>
          <span class="w-[180px] text-xs text-text-muted text-center font-mono">{{ user.createdAt }}</span>
          <div class="w-[100px] flex items-center justify-center gap-1">
            <button
              v-if="user.id !== currentUserId && user.status !== 'deactivated'"
              class="rounded p-1 text-text-muted hover:bg-gray-100 transition-colors"
              :title="user.status === 'disabled' ? '启用' : '禁用'"
              @click="toggleStatus(user)"
            >
              <component :is="user.status === 'disabled' ? CheckCircle2 : Ban" :size="14" />
            </button>
          </div>
          </div>
        </template>
        <div v-if="!loading && paginatedUsers.length === 0" class="flex items-center justify-center h-40 text-sm text-text-muted">
          暂无用户
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { Search, ChevronDown, ChevronLeft, ChevronRight, Ban, CheckCircle2 } from 'lucide-vue-next'
import gsap from 'gsap'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { api } from '@/utils/api'
import { useToast } from '@/composables/useToast'

const toast = useToast()

type UserStatus = 'active' | 'disabled' | 'deactivated'

const STATUS_LABELS: Record<UserStatus, string> = {
  active: '正常',
  disabled: '已禁用',
  deactivated: '已注销'
}

interface User {
  id: number
  name: string
  email: string
  status: UserStatus
  statusLabel: string
  orderCount: number
  createdAt: string
}

const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const users = ref<User[]>([])
const total = ref(0)
const loading = ref(false)
const currentUserId = ref<number>(0)

const tip = reactive({ visible: false, text: '', x: 0, y: 0 })

async function fetchCurrentUser() {
  const res = await api.get<{ id: number }>('/auth/me')
  if (res.success && res.data) {
    currentUserId.value = res.data.id
  }
}

async function fetchUsers() {
  loading.value = true
  const res = await api.get<{
    items: Array<{
      id: number
      email: string
      name: string
      status: UserStatus
      lastLoginAt: string | null
      createdAt: string
      orderCount: number
    }>
    total: number
  }>('/admin/users', {
    page: currentPage.value,
    limit: 8,
    q: searchQuery.value || '',
    status: statusFilter.value || '',
  })
  if (res.success && res.data) {
    users.value = (res.data.items || []).map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      status: item.status,
      statusLabel: STATUS_LABELS[item.status] ?? item.status,
      orderCount: item.orderCount,
      createdAt: (item.createdAt || '').replace('T', ' ').slice(0, 19),
    }))
    total.value = res.data.total
  }
  loading.value = false
  nextTick(() => {
    const rows = tableBodyRef.value?.querySelectorAll('.border-b')
    if (rows?.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.from(rows, { opacity: 0, duration: 0.2, stagger: 0.02, ease: 'power2.out' })
    }
  })
}

async function setStatus(user: User, status: UserStatus) {
  const res = await api.put(`/admin/users/${user.id}`, { status })
  if (!res.success) {
    toast.error(res.error || '操作失败')
    return
  }
  toast.success('状态已更新')
  await fetchUsers()
}

async function toggleStatus(user: User) {
  await setStatus(user, user.status === 'disabled' ? 'active' : 'disabled')
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

const totalPages = computed(() => Math.ceil(total.value / 8) || 1)
const paginatedUsers = computed(() => users.value)
const tableBodyRef = ref<HTMLElement | null>(null)

watch([searchQuery, statusFilter], () => {
  if (currentPage.value !== 1) {
    currentPage.value = 1
  } else {
    fetchUsers()
  }
})

watch(currentPage, fetchUsers)

onMounted(async () => {
  await fetchCurrentUser()
  await fetchUsers()
})
</script>
