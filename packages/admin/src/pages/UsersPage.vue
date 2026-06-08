<template>
  <div class="p-6 flex flex-col gap-4 h-full">
    <div>
      <h1 class="text-[22px] font-bold text-text-primary">用户管理</h1>
      <p class="text-[13px] text-text-muted">管理所有注册用户</p>
    </div>

    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 w-[280px] h-9 rounded border border-border px-3 bg-white">
        <Search :size="16" class="text-text-muted shrink-0" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索邮箱或姓名..."
          class="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
        />
      </div>

      <div class="relative">
        <select
          v-model="roleFilter"
          class="h-9 rounded border border-border px-3 pr-8 text-[13px] text-text-primary bg-white outline-none appearance-none cursor-pointer"
        >
          <option value="">全部角色</option>
          <option value="admin">管理员</option>
          <option value="user">普通用户</option>
        </select>
        <ChevronDown :size="16" class="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>

      <div class="relative">
        <select
          v-model="statusFilter"
          class="h-9 rounded border border-border px-3 pr-8 text-[13px] text-text-primary bg-white outline-none appearance-none cursor-pointer"
        >
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="disabled">已禁用</option>
        </select>
        <ChevronDown :size="16" class="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>
    </div>

    <div class="flex-1 bg-card border border-border rounded-md overflow-hidden flex flex-col">
      <div class="flex-1 overflow-auto">
        <div class="flex items-center px-4 bg-[#C8DBBC] h-11 shrink-0 sticky top-0 z-10">
          <span class="w-[50px] text-xs font-semibold text-text-muted text-center">ID</span>
          <span class="w-[140px] text-xs font-semibold text-text-muted text-center">用户名</span>
          <span class="flex-1 text-xs font-semibold text-text-muted text-center">邮箱</span>
          <span class="w-[90px] text-xs font-semibold text-text-muted text-center">手机号</span>
          <span class="w-[80px] text-xs font-semibold text-text-muted text-center">状态</span>
          <span class="w-[100px] text-xs font-semibold text-text-muted text-center">注册时间</span>
        </div>
        <div
          v-for="user in paginatedUsers"
          :key="user.id"
          class="flex items-center px-4 h-12 border-b border-border"
        >
          <span class="w-[50px] text-[13px] text-text-primary text-center">{{ user.id }}</span>
          <span class="w-[140px] text-[13px] text-text-primary font-medium text-center">{{ user.username }}</span>
          <span class="flex-1 text-[13px] text-text-primary text-center">{{ user.email }}</span>
          <span class="w-[90px] text-[13px] text-text-primary text-center">{{ user.phone }}</span>
          <span
            class="w-[80px] text-[13px] font-medium text-center"
            :class="user.status === '正常' ? 'text-primary-light' : 'text-danger'"
          >
            {{ user.status }}
          </span>
          <span class="w-[100px] text-[13px] text-text-primary text-center">{{ user.createdAt }}</span>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <span class="text-[13px] text-muted-foreground">共 {{ filteredUsers.length }} 条，每页 8 条</span>
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
            ? 'bg-text-primary text-white'
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)

interface User {
  id: number
  username: string
  email: string
  phone: string
  status: string
  createdAt: string
}

const users = ref<User[]>([
  { id: 1, username: 'zhangsan', email: 'zhangsan@example.com', phone: '138****1234', status: '正常', createdAt: '2024-01-15' },
  { id: 2, username: 'lisi', email: 'lisi@example.com', phone: '139****5678', status: '正常', createdAt: '2024-02-20' },
  { id: 3, username: 'wangwu', email: 'wangwu@example.com', phone: '137****9012', status: '已禁用', createdAt: '2024-03-10' },
  { id: 4, username: 'zhaoliu', email: 'zhaoliu@example.com', phone: '136****3456', status: '正常', createdAt: '2024-04-05' },
  { id: 5, username: 'sunqi', email: 'sunqi@example.com', phone: '135****7890', status: '正常', createdAt: '2024-05-12' },
  { id: 6, username: 'zhouba', email: 'zhouba@example.com', phone: '134****2345', status: '正常', createdAt: '2024-06-18' },
  { id: 7, username: 'wujiu', email: 'wujiu@example.com', phone: '133****6789', status: '已禁用', createdAt: '2024-07-22' },
  { id: 8, username: 'zhengshi', email: 'zhengshi@example.com', phone: '132****0123', status: '正常', createdAt: '2024-08-30' },
  { id: 9, username: 'qianyi', email: 'qianyi@example.com', phone: '131****4567', status: '正常', createdAt: '2024-09-14' },
  { id: 10, username: 'fenger', email: 'fenger@example.com', phone: '130****8901', status: '正常', createdAt: '2024-10-25' },
  { id: 11, username: 'chenxi', email: 'chenxi@example.com', phone: '158****2345', status: '已禁用', createdAt: '2024-11-08' },
  { id: 12, username: 'linmei', email: 'linmei@example.com', phone: '159****6789', status: '正常', createdAt: '2024-12-01' },
])

const filteredUsers = computed(() => {
  return users.value.filter((user) => {
    const matchSearch = !searchQuery.value ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchRole = !roleFilter.value
    const matchStatus = !statusFilter.value ||
      (statusFilter.value === 'active' && user.status === '正常') ||
      (statusFilter.value === 'disabled' && user.status === '已禁用')
    return matchSearch && matchRole && matchStatus
  })
})

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / 8) || 1)

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * 8
  return filteredUsers.value.slice(start, start + 8)
})
</script>
