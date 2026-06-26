<template>
  <div class="p-6 flex flex-col gap-4 min-h-screen">
    <div>
      <h1 class="text-xl font-bold text-text-primary">订单管理</h1>
      <p class="text-sm text-text-muted">管理所有客户订单</p>
    </div>

    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 w-[280px] h-9 rounded border border-border px-3 bg-white focus-within:border-primary transition-colors">
        <Search :size="16" class="text-text-muted shrink-0" />
        <input
          v-model="searchQuery"
          type="text"
          aria-label="搜索订单号或客户"
          placeholder="搜索订单号或客户..."
          class="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
        />
      </div>

      <div class="flex items-center gap-1">
        <button
          v-for="tab in statusTabs"
          :key="tab.key"
          class="rounded px-3 py-1.5 text-sm transition-colors"
          :class="activeStatus === tab.key
            ? 'bg-primary text-white font-medium'
            : 'text-text-muted hover:bg-gray-100'"
          @click="activeStatus = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div class="flex-1 bg-card border border-border rounded-md overflow-hidden flex flex-col">
      <div class="flex items-center px-4 bg-table-header h-11 shrink-0">
        <span class="w-[80px] text-xs font-semibold text-text-muted">订单号</span>
        <span class="w-[120px] text-xs font-semibold text-text-muted">客户</span>
        <span class="flex-1 text-xs font-semibold text-text-muted">商品</span>
        <span class="w-[90px] text-xs font-semibold text-text-muted">金额</span>
        <span class="w-[90px] text-xs font-semibold text-text-muted">状态</span>
        <span class="w-[100px] text-xs font-semibold text-text-muted">日期</span>
        <span class="w-[60px]"></span>
      </div>

      <div ref="tableBodyRef" class="flex-1 overflow-auto">
        <div v-if="loading" class="flex items-center justify-center h-40">
          <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <template v-else>
          <div
            v-for="order in paginatedOrders"
            :key="order.id"
            class="flex items-center px-4 h-[52px] border-b border-border"
          >
          <span class="w-[80px] text-sm text-primary font-mono font-medium">{{ order.orderNo }}</span>
          <span class="w-[120px] text-sm text-text-primary">{{ order.customer }}</span>
          <span class="flex-1 text-sm text-text-muted">{{ order.product }}</span>
          <span class="w-[90px] text-sm text-text-primary font-semibold">{{ order.amount }}</span>
          <span class="w-[90px]">
            <StatusBadge :label="order.status" :variant="statusVariant(order.status)" />
          </span>
          <span class="w-[100px] text-xs text-text-muted font-mono">{{ order.date }}</span>
          <div class="w-[60px]">
            <button aria-label="查看订单详情" class="rounded p-1 text-text-muted hover:bg-gray-100 transition-colors" @click="$router.push('/orders/' + order.id)">
              <Eye :size="14" />
            </button>
          </div>
          </div>
        </template>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <span class="text-sm text-text-muted">显示 {{ startItem }}-{{ endItem }} 条，共 {{ filteredOrders.length }} 条</span>
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
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Search, Eye, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import gsap from 'gsap'
import { api } from '@/utils/api'
import StatusBadge from '@/components/ui/StatusBadge.vue'

const searchQuery = ref('')
const activeStatus = ref('all')
const currentPage = ref(1)
const loading = ref(false)

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'paid', label: '已付款' },
  { key: 'processing', label: '处理中' },
  { key: 'shipped', label: '已发货' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
]

const statusKeyMap: Record<string, string> = {
  '待处理': 'pending',
  '已付款': 'paid',
  '处理中': 'processing',
  '已发货': 'shipped',
  '已完成': 'completed',
  '已取消': 'cancelled',
}

const statusVariantMap: Record<string, string> = {
  pending: 'warning',
  paid: 'info',
  processing: 'primary-light',
  shipped: 'primary',
  completed: 'success',
  cancelled: 'danger',
}

function statusVariant(status: string) {
  const key = statusKeyMap[status] ?? ''
  return (statusVariantMap[key] ?? 'inactive') as 'warning' | 'info' | 'primary-light' | 'primary' | 'success' | 'danger' | 'inactive'
}

interface Order {
  id: number
  orderNo: string
  customer: string
  product: string
  amount: string
  status: string
  date: string
}

const orders = ref<Order[]>([])
const total = ref(0)

const filteredOrders = computed(() => orders.value)

const totalPages = computed(() => Math.ceil(total.value / 8) || 1)

const startItem = computed(() => total.value > 0 ? (currentPage.value - 1) * 8 + 1 : 0)
const endItem = computed(() => Math.min(currentPage.value * 8, total.value))

const paginatedOrders = computed(() => orders.value)

const tableBodyRef = ref<HTMLElement | null>(null)

const apiStatusToChinese: Record<string, string> = {
  pending: '待处理',
  paid: '已付款',
  processing: '处理中',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
}

async function fetchOrders() {
  loading.value = true
  const params: Record<string, unknown> = {
    page: currentPage.value,
    limit: 8,
  }
  if (activeStatus.value !== 'all') {
    params.status = activeStatus.value
  }
  if (searchQuery.value.trim()) {
    params.q = searchQuery.value.trim()
  }
  const res = await api.get<{ items: any[]; total: number }>('/admin/orders', params)
  if (res.success && res.data) {
    orders.value = (res.data.items ?? []).map((item) => ({
      id: item.id,
      orderNo: item.orderNo ?? `ORD-${item.id}`,
      customer: item.userName ?? '',
      product: item.itemCount != null ? `${item.itemCount}件商品` : '',
      amount: item.total != null ? `¥${Number(item.total)}` : '',
      status: apiStatusToChinese[item.status] ?? item.status,
      date: item.createdAt ? item.createdAt.slice(0, 10) : '',
    }))
    total.value = res.data.total ?? 0
  } else {
    orders.value = []
    total.value = 0
  }
  loading.value = false
}

onMounted(fetchOrders)

watch(activeStatus, () => {
  currentPage.value = 1
})

watch([activeStatus, currentPage], fetchOrders)

let searchTimer: ReturnType<typeof setTimeout>
watch(searchQuery, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchOrders()
  }, 300)
})

watch([searchQuery, activeStatus, currentPage], () => {
  nextTick(() => {
    const rows = tableBodyRef.value?.querySelectorAll('.border-b')
    if (rows?.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.from(rows, { opacity: 0, duration: 0.2, stagger: 0.02, ease: 'power2.out' })
    }
  })
})
</script>
