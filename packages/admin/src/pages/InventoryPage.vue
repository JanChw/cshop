<template>
  <div class="p-6 flex flex-col gap-5 min-h-screen">
    <div>
      <h1 class="text-xl font-bold text-text-primary">库存仪表盘</h1>
      <p class="text-sm text-text-muted">查看库存分析、低库存预警和品类分布</p>
    </div>

    <div v-if="loading" class="flex items-center justify-center h-40">
      <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>

    <template v-else>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="商品总数" :value="String(summary.productCount)" icon="Package" change="含变体" />
        <MetricCard label="库存总价值" :value="`¥${summary.totalValue.toLocaleString()}`" icon="DollarSign" change="含商品+变体" />
        <MetricCard label="低库存商品" :value="String(summary.lowStockCount)" icon="AlertTriangle" :change="`缺货: ${summary.outOfStockCount}`" />
        <MetricCard label="品类数" :value="String(summary.categoryCount)" icon="Layers" change="覆盖 {{ summary.categoryCount }} 个分类" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div class="bg-card border border-border rounded-md p-5 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-text-primary">品类库存分布</span>
          </div>
          <div class="h-[240px] flex items-end gap-3 pl-2 pr-4 pb-6" ref="chartRef">
            <div v-for="(item, i) in categoryData" :key="i" class="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <span class="text-[11px] text-text-muted font-medium">{{ item.totalStock }}</span>
              <div
                class="w-full rounded-t-sm transition-all duration-500"
                :style="{ height: barHeight(item.totalStock), backgroundColor: barColor(i) }"
              />
              <span class="text-[11px] text-text-muted truncate w-full text-center" :title="item.categoryName">{{ item.categoryName }}</span>
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-md p-5 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-text-primary">库存周转</span>
          </div>
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between py-2 border-b border-border">
              <span class="text-sm text-text-muted">统计周期</span>
              <span class="text-sm text-text-primary font-medium">{{ turnover.periodDays }} 天</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border">
              <span class="text-sm text-text-muted">期间销量</span>
              <span class="text-sm text-text-primary font-medium">{{ turnover.soldQuantity }} 件</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border">
              <span class="text-sm text-text-muted">平均库存</span>
              <span class="text-sm text-text-primary font-medium">{{ turnover.avgStock }} 件</span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-text-muted">周转率</span>
              <span class="text-sm font-bold" :class="turnover.turnoverRate > 1 ? 'text-success' : 'text-warning'">
                {{ turnover.turnoverRate }}x
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-card border border-border rounded-md overflow-hidden flex flex-col">
        <div class="flex items-center justify-between px-5 py-4 border-b border-border">
          <span class="text-sm font-semibold text-text-primary">低库存商品预警</span>
          <div class="flex items-center gap-2">
            <span class="text-xs text-text-muted">阈值：</span>
            <div class="relative">
              <select v-model.number="lowStockThreshold" class="h-8 rounded border border-border px-3 pr-8 text-xs text-text-primary bg-white outline-none appearance-none cursor-pointer" @change="fetchLowStock">
                <option :value="5">≤ 5</option>
                <option :value="10">≤ 10</option>
                <option :value="20">≤ 20</option>
                <option :value="50">≤ 50</option>
              </select>
              <ChevronDown :size="12" class="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          </div>
        </div>
        <div class="flex items-center px-4 bg-table-header h-11 shrink-0">
          <span class="w-[60px] text-xs font-semibold text-text-primary">ID</span>
          <span class="flex-1 text-xs font-semibold text-text-primary">商品名称</span>
          <span class="w-[100px] text-xs font-semibold text-text-primary">分类</span>
          <span class="w-[80px] text-xs font-semibold text-text-primary text-center">库存</span>
          <span class="w-[80px] text-xs font-semibold text-text-primary text-right">价格</span>
          <span class="w-[70px] text-xs font-semibold text-text-primary text-center">状态</span>
        </div>
        <div class="flex-1">
          <div v-if="lowStockItems.length === 0" class="flex items-center justify-center h-20">
            <span class="text-sm text-text-muted">暂无低库存商品</span>
          </div>
          <div v-for="item in lowStockItems" :key="item.id"
            class="flex items-center px-4 h-[52px] border-b border-border">
            <span class="w-[60px] text-sm text-text-primary font-mono">{{ item.id }}</span>
            <span class="flex-1 text-sm text-text-primary">{{ item.name }}</span>
            <span class="w-[100px] text-sm text-text-muted">{{ item.categoryName || '-' }}</span>
            <span class="w-[80px] text-sm text-center" :class="item.stock === 0 ? 'text-danger font-semibold' : item.stock <= 5 ? 'text-warning font-semibold' : 'text-text-primary'">
              {{ item.stock }}
            </span>
            <span class="w-[80px] text-sm text-text-primary text-right">¥{{ item.basePrice }}</span>
            <span class="w-[70px] text-center">
              <StatusBadge :label="item.isActive ? '上架' : '下架'" :variant="item.isActive ? 'success' : 'inactive'" />
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { api } from '@/utils/api'
import MetricCard from '@/components/ui/MetricCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'

const loading = ref(true)
const chartRef = ref<HTMLElement | null>(null)
const lowStockThreshold = ref(5)

interface Summary {
  productCount: number
  variantCount: number
  totalStock: number
  totalValue: number
  lowStockCount: number
  outOfStockCount: number
  categoryCount: number
}

interface CatItem {
  categoryId: number | null
  categoryName: string
  productCount: number
  totalStock: number
  totalValue: number
}

interface LowStockItem {
  id: number
  name: string
  stock: number
  basePrice: number
  isActive: boolean
  categoryName: string | null
  image: string | null
}

interface Turnover {
  periodDays: number
  soldQuantity: number
  avgStock: number
  turnoverRate: number
}

const summary = ref<Summary>({
  productCount: 0,
  variantCount: 0,
  totalStock: 0,
  totalValue: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
  categoryCount: 0,
})

const categoryData = ref<CatItem[]>([])
const lowStockItems = ref<LowStockItem[]>([])
const turnover = ref<Turnover>({
  periodDays: 30,
  soldQuantity: 0,
  avgStock: 0,
  turnoverRate: 0,
})

const maxStock = computed(() => {
  if (categoryData.value.length === 0) return 1
  return Math.max(...categoryData.value.map((c) => c.totalStock), 1)
})

function barHeight(stock: number) {
  const ratio = stock / maxStock.value
  return `${Math.max(ratio * 180, 4)}px`
}

const palette = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
]

function barColor(i: number) {
  return palette[i % palette.length]
}

async function fetchSummary() {
  const res = await api.get<Summary>('/admin/inventory/summary')
  if (res.success && res.data) {
    summary.value = res.data
  }
}

async function fetchCategoryData() {
  const res = await api.get<{ items: CatItem[] }>('/admin/inventory/by-category')
  if (res.success && res.data) {
    categoryData.value = res.data.items ?? []
  }
}

async function fetchLowStock() {
  const res = await api.get<{ items: LowStockItem[]; total: number; threshold: number }>(
    '/admin/inventory/low-stock', { threshold: lowStockThreshold.value }
  )
  if (res.success && res.data) {
    lowStockItems.value = res.data.items ?? []
  }
}

async function fetchTurnover() {
  const res = await api.get<Turnover>('/admin/inventory/turnover')
  if (res.success && res.data) {
    turnover.value = res.data
  }
}

onMounted(async () => {
  await Promise.all([fetchSummary(), fetchCategoryData(), fetchLowStock(), fetchTurnover()])
  loading.value = false
})
</script>
