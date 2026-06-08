<template>
  <div class="p-6 flex flex-col gap-4 min-h-screen">
    <div>
      <h1 class="text-xl font-bold text-text-primary">订单管理</h1>
      <p class="text-sm text-text-muted">管理所有客户订单</p>
    </div>

    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 w-[280px] h-9 rounded border border-border px-3 bg-white">
        <Search :size="16" class="text-text-muted shrink-0" />
        <input
          v-model="searchQuery"
          type="text"
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

      <div class="flex-1 overflow-auto">
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
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
              :style="{ backgroundColor: statusColors[order.status] }"
            >
              {{ order.status }}
            </span>
          </span>
          <span class="w-[100px] text-xs text-text-muted font-mono">{{ order.date }}</span>
          <div class="w-[60px]">
            <button class="rounded p-1 text-text-muted hover:bg-gray-100 transition-colors">
              <Eye :size="14" />
            </button>
          </div>
        </div>
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
import { ref, computed } from 'vue'
import { Search, Eye, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const searchQuery = ref('')
const activeStatus = ref('all')
const currentPage = ref(1)

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'paid', label: '已付款' },
  { key: 'processing', label: '处理中' },
  { key: 'shipped', label: '已发货' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
]

const statusColors: Record<string, string> = {
  '待处理': '#F59E0B',
  '已付款': '#4A9FD8',
  '处理中': '#4A8C5E',
  '已发货': '#2D5E3A',
  '已完成': '#28A745',
  '已取消': '#EF4444',
}

const statusKeyMap: Record<string, string> = {
  '待处理': 'pending',
  '已付款': 'paid',
  '处理中': 'processing',
  '已发货': 'shipped',
  '已完成': 'completed',
  '已取消': 'cancelled',
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

const orders = ref<Order[]>([
  { id: 1, orderNo: 'ORD-1024', customer: '张三', product: '经典圆领T恤 x2', amount: '¥198', status: '待处理', date: '2024-01-15' },
  { id: 2, orderNo: 'ORD-1023', customer: '李四', product: '潮流连帽卫衣 x1', amount: '¥399', status: '已付款', date: '2024-01-15' },
  { id: 3, orderNo: 'ORD-1022', customer: '王五', product: '修身牛仔裤 x1, 配饰 x3', amount: '¥567', status: '处理中', date: '2024-01-14' },
  { id: 4, orderNo: 'ORD-1021', customer: '赵六', product: '加绒外套 x1', amount: '¥299', status: '已发货', date: '2024-01-14' },
  { id: 5, orderNo: 'ORD-1020', customer: '孙七', product: '纯棉Polo衫 x3', amount: '¥447', status: '已完成', date: '2024-01-13' },
  { id: 6, orderNo: 'ORD-1019', customer: '周八', product: '经典圆领T恤 x1', amount: '¥99', status: '已取消', date: '2024-01-13' },
  { id: 7, orderNo: 'ORD-1018', customer: '吴九', product: '潮流连帽卫衣 x2, 裤子 x1', amount: '¥997', status: '待处理', date: '2024-01-12' },
  { id: 8, orderNo: 'ORD-1017', customer: '郑十', product: '连衣裙 x1', amount: '¥259', status: '已付款', date: '2024-01-12' },
  { id: 9, orderNo: 'ORD-1016', customer: '钱一', product: '配饰 x5', amount: '¥175', status: '处理中', date: '2024-01-11' },
  { id: 10, orderNo: 'ORD-1015', customer: '冯二', product: '修身牛仔裤 x2', amount: '¥398', status: '已发货', date: '2024-01-11' },
  { id: 11, orderNo: 'ORD-1014', customer: '陈西', product: '加绒外套 x1, T恤 x2', amount: '¥497', status: '已完成', date: '2024-01-10' },
  { id: 12, orderNo: 'ORD-1013', customer: '林美', product: '潮流连帽卫衣 x1', amount: '¥399', status: '待处理', date: '2024-01-10' },
])

const filteredOrders = computed(() => {
  return orders.value.filter((order) => {
    const matchSearch = !searchQuery.value ||
      order.orderNo.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchStatus = activeStatus.value === 'all' ||
      statusKeyMap[order.status] === activeStatus.value
    return matchSearch && matchStatus
  })
})

const totalPages = computed(() => Math.ceil(filteredOrders.value.length / 8) || 1)

const startItem = computed(() => (currentPage.value - 1) * 8 + 1)
const endItem = computed(() => Math.min(currentPage.value * 8, filteredOrders.value.length))

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * 8
  return filteredOrders.value.slice(start, start + 8)
})
</script>
