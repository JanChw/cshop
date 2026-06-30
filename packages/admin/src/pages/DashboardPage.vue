<template>
  <div class="p-6 pb-12 flex flex-col gap-6 min-h-screen">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-text-primary">仪表盘</h1>
        <p class="text-sm text-text-muted">欢迎回来，管理员</p>
      </div>
    </div>

    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="rounded-md border border-border bg-card p-5 flex items-center justify-center h-24">
        <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        v-for="metric in metrics"
        :key="metric.label"
        v-bind="metric"
      />
    </div>

    <div class="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
      <div class="flex-1 bg-card border border-border rounded-md p-5 flex flex-col gap-4 min-w-0">
        <div class="flex items-center justify-between">
          <span class="text-base font-semibold text-text-primary">销售趋势</span>
          <span class="text-xs text-text-muted">最近7天</span>
        </div>
        <div class="flex-1 min-h-0">
          <BarChart :bars="chartBars" />
        </div>
      </div>

      <div class="w-full lg:w-[480px] bg-card border border-border rounded-md p-5 flex flex-col gap-4 shrink-0 min-h-0">
        <span class="text-base font-semibold text-text-primary">最近订单</span>

        <div class="flex items-center pb-2 border-b border-border shrink-0">
          <span class="flex-1 text-xs font-semibold text-text-primary">订单号</span>
          <span class="flex-1 text-xs font-semibold text-text-primary">客户</span>
          <span class="flex-1 text-xs font-semibold text-text-primary">金额</span>
          <span class="w-[70px] text-xs font-semibold text-text-primary">状态</span>
        </div>

        <div v-if="loading" class="flex items-center justify-center h-40">
          <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <div v-else class="flex-1 min-h-0 overflow-auto">
          <div
            v-for="order in recentOrders"
            :key="order.id"
            class="flex items-center py-2.5 border-b border-border"
          >
            <span class="flex-1 text-sm text-text-primary font-mono">{{ order.id }}</span>
            <span class="flex-1 text-sm text-text-primary">{{ order.customer }}</span>
            <span class="flex-1 text-sm text-text-primary font-medium">{{ order.amount }}</span>
            <StatusBadge v-bind="order.badge" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Package, Timer, TrendingUp, Users } from 'lucide-vue-next'
import { api } from '@/utils/api'
import MetricCard from '@/components/ui/MetricCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import BarChart from '@/components/ui/BarChart.vue'

const loading = ref(true)

interface DashboardData {
  productCount: number
  orderCount: number
  pendingCount: number
  totalRevenue: number
}

interface SummaryData {
  topProducts: Array<{ name: string; sales: number }>
  funnel: { views: number; addToCart: number; createOrder: number; paid: number }
  trend: Array<{ date: string; pv: number; orders: number }>
}

interface OrderItem {
  id: number
  orderNo: string
  userName: string
  total: number
  status: string
  createdAt: string
}

const dashboardData = ref<DashboardData | null>(null)
const summaryData = ref<SummaryData | null>(null)
const ordersData = ref<OrderItem[]>([])

const statusMap: Record<string, { label: string; variant: 'warning' | 'primary' | 'success' | 'danger' }> = {
  pending: { label: '待处理', variant: 'warning' },
  paid: { label: '已付款', variant: 'primary' },
  shipped: { label: '已发货', variant: 'primary' },
  completed: { label: '已完成', variant: 'success' },
  cancelled: { label: '已取消', variant: 'danger' },
  refunding: { label: '退款中', variant: 'warning' },
  refunded: { label: '已退款', variant: 'danger' },
}

const metrics = computed(() => {
  const d = dashboardData.value
  if (!d) return []
  return [
    { label: '商品总数', value: String(d.productCount), change: '', icon: Package },
    { label: '待处理订单', value: String(d.pendingCount), change: '', icon: Timer },
    { label: '本月营收', value: `¥${d.totalRevenue.toLocaleString()}`, change: '', icon: TrendingUp },
    { label: '总订单', value: String(d.orderCount), change: '', icon: Users },
  ]
})

const chartBars = computed(() => {
  const trend = summaryData.value?.trend
  if (!trend || trend.length === 0) return []
  const maxPv = Math.max(...trend.map(t => t.pv), 1)
  const days = ['日', '一', '二', '三', '四', '五', '六']
  const todayStr = new Date().toISOString().slice(0, 10)
  return trend.map(t => {
    const date = new Date(t.date)
    const isToday = t.date === todayStr
    return {
      label: `周${days[date.getDay()]}`,
      height: Math.round((t.pv / maxPv) * 100),
      color: isToday ? 'var(--color-primary)' : undefined,
    }
  })
})

const recentOrders = computed(() => {
  return ordersData.value.map(o => ({
    id: o.orderNo,
    customer: o.userName,
    amount: `¥${o.total.toFixed(2)}`,
    badge: statusMap[o.status] || { label: o.status, variant: 'warning' as const },
  }))
})

onMounted(async () => {
  const [dashboardRes, summaryRes, ordersRes] = await Promise.all([
    api.get<DashboardData>('/admin/dashboard'),
    api.get<SummaryData>('/admin/analytics/summary', { period: '7d' }),
    api.get<{ items: OrderItem[]; total: number }>('/admin/orders', { page: 1, limit: 5 }),
  ])
  if (dashboardRes.success && dashboardRes.data) {
    dashboardData.value = dashboardRes.data
  }
  if (summaryRes.success && summaryRes.data) {
    summaryData.value = summaryRes.data
  }
  if (ordersRes.success && ordersRes.data) {
    ordersData.value = ordersRes.data.items
  }
  loading.value = false
})
</script>
