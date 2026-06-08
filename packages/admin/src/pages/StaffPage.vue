<template>
  <div class="p-6 flex flex-col gap-4 min-h-screen">
    <div>
      <h1 class="text-xl font-bold text-text-primary">员工管理</h1>
      <p class="text-sm text-text-muted">管理所有员工账号</p>
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
          class="h-9 rounded border border-border px-3 pr-8 text-sm text-text-primary bg-white outline-none appearance-none cursor-pointer"
        >
          <option value="">全部角色</option>
          <option value="admin">管理员</option>
          <option value="tech">技术部</option>
          <option value="sales">销售部</option>
          <option value="ops">运营部</option>
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
          <option value="resigned">已离职</option>
        </select>
        <ChevronDown :size="16" class="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>
    </div>

    <div class="flex-1 bg-card border border-border rounded-md overflow-hidden flex flex-col">
      <div class="flex-1 overflow-auto">
        <div class="flex items-center px-4 bg-table-header h-11 shrink-0 sticky top-0 z-10">
          <span class="w-[50px] text-xs font-semibold text-text-muted text-center">ID</span>
          <span class="w-[80px] text-xs font-semibold text-text-muted text-center">姓名</span>
          <span class="w-[80px] text-xs font-semibold text-text-muted text-center">部门</span>
          <span class="w-[100px] text-xs font-semibold text-text-muted text-center">职位</span>
          <span class="w-[150px] text-xs font-semibold text-text-muted text-center">邮箱</span>
          <span class="w-[110px] text-xs font-semibold text-text-muted text-center">手机</span>
          <span class="w-[70px] text-xs font-semibold text-text-muted text-center">状态</span>
          <span class="w-[90px] text-xs font-semibold text-text-muted text-center">入职时间</span>
          <span class="w-[50px]"></span>
        </div>
        <div
          v-for="staff in paginatedStaff"
          :key="staff.id"
          class="flex items-center px-4 h-[52px] border-b border-border"
        >
          <span class="w-[50px] text-sm text-text-muted font-mono text-center">{{ staff.id }}</span>
          <span class="w-[80px] text-sm text-text-primary font-medium text-center">{{ staff.name }}</span>
          <span class="w-[80px] text-sm text-text-muted text-center">{{ staff.department }}</span>
          <span class="w-[100px] text-sm text-text-muted text-center">{{ staff.position }}</span>
          <span class="w-[150px] text-xs text-text-muted font-mono text-center">{{ staff.email }}</span>
          <span class="w-[110px] text-xs text-text-muted font-mono text-center">
            {{ visiblePhones.has(staff.id) ? staff.phone : '****' }}
          </span>
          <span class="w-[70px] text-center">
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
              :class="staff.status === '在职' ? 'bg-primary-light' : 'bg-danger'"
            >
              {{ staff.status }}
            </span>
          </span>
          <span class="w-[90px] text-xs text-text-muted font-mono text-center">{{ staff.joinDate }}</span>
          <div class="w-[50px] flex justify-center">
            <button
              class="rounded p-1 text-text-muted hover:bg-gray-100 transition-colors"
              @click="togglePhone(staff.id)"
            >
              <Eye :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <span class="text-sm text-muted-foreground">共 {{ filteredStaff.length }} 条，每页 8 条</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, ChevronDown, ChevronLeft, ChevronRight, Eye } from 'lucide-vue-next'

const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const visiblePhones = ref(new Set<number>())

function togglePhone(id: number) {
  if (visiblePhones.value.has(id)) {
    visiblePhones.value.delete(id)
  } else {
    visiblePhones.value.add(id)
  }
}

interface Staff {
  id: number
  name: string
  department: string
  position: string
  email: string
  phone: string
  status: string
  joinDate: string
}

const staffList = ref<Staff[]>([
  { id: 1, name: '张三', department: '技术部', position: '前端工程师', email: 'zhangsan@cshop.com', phone: '138****1234', status: '在职', joinDate: '2023-06-15' },
  { id: 2, name: '李四', department: '技术部', position: '后端工程师', email: 'lisi@cshop.com', phone: '139****5678', status: '在职', joinDate: '2023-07-20' },
  { id: 3, name: '王五', department: '销售部', position: '销售经理', email: 'wangwu@cshop.com', phone: '137****9012', status: '已离职', joinDate: '2023-03-10' },
  { id: 4, name: '赵六', department: '运营部', position: '运营专员', email: 'zhaoliu@cshop.com', phone: '136****3456', status: '在职', joinDate: '2023-09-05' },
  { id: 5, name: '孙七', department: '技术部', position: 'UI 设计师', email: 'sunqi@cshop.com', phone: '135****7890', status: '在职', joinDate: '2023-11-12' },
  { id: 6, name: '周八', department: '销售部', position: '客户经理', email: 'zhouba@cshop.com', phone: '134****2345', status: '在职', joinDate: '2024-01-18' },
  { id: 7, name: '吴九', department: '技术部', position: '测试工程师', email: 'wujiu@cshop.com', phone: '133****6789', status: '已离职', joinDate: '2022-12-22' },
  { id: 8, name: '郑十', department: '运营部', position: '内容运营', email: 'zhengshi@cshop.com', phone: '132****0123', status: '在职', joinDate: '2024-03-30' },
  { id: 9, name: '钱一', department: '技术部', position: '全栈工程师', email: 'qianyi@cshop.com', phone: '131****4567', status: '在职', joinDate: '2024-05-14' },
  { id: 10, name: '冯二', department: '销售部', position: '销售代表', email: 'fenger@cshop.com', phone: '130****8901', status: '在职', joinDate: '2024-07-25' },
  { id: 11, name: '陈西', department: '运营部', position: '市场专员', email: 'chenxi@cshop.com', phone: '158****2345', status: '已离职', joinDate: '2023-08-08' },
  { id: 12, name: '林美', department: '技术部', position: '产品经理', email: 'linmei@cshop.com', phone: '159****6789', status: '在职', joinDate: '2023-02-01' },
])

const filteredStaff = computed(() => {
  return staffList.value.filter((s) => {
    const matchSearch = !searchQuery.value ||
      s.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchRole = !roleFilter.value
    const matchStatus = !statusFilter.value ||
      (statusFilter.value === 'active' && s.status === '在职') ||
      (statusFilter.value === 'resigned' && s.status === '已离职')
    return matchSearch && matchRole && matchStatus
  })
})

const totalPages = computed(() => Math.ceil(filteredStaff.value.length / 8) || 1)

const paginatedStaff = computed(() => {
  const start = (currentPage.value - 1) * 8
  return filteredStaff.value.slice(start, start + 8)
})
</script>
