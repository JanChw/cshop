<template>
  <div class="p-6 flex flex-col gap-5 min-h-screen">
    <div class="flex items-center gap-3">
      <button class="rounded p-1 text-text-muted hover:bg-gray-100 transition-colors" @click="$router.push('/orders')">
        <ArrowLeft :size="20" />
      </button>
      <div>
        <h1 class="text-xl font-bold text-text-primary">订单详情</h1>
        <p class="text-sm text-text-muted">{{ order?.orderNo ?? '加载中...' }}</p>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center h-40">
      <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>

    <template v-else-if="order">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div class="bg-card border border-border rounded-md p-5 flex flex-col gap-3">
          <span class="text-sm font-semibold text-text-primary">订单信息</span>
          <div class="flex flex-col gap-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-text-muted">订单号</span>
              <span class="text-text-primary font-mono font-medium">{{ order.orderNo }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-text-muted">状态</span>
              <StatusBadge :label="order.statusLabel" :variant="statusVariant" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-text-muted">订单金额</span>
              <span class="text-text-primary font-semibold">¥{{ order.total }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-text-muted">创建时间</span>
              <span class="text-text-primary">{{ order.createdAt }}</span>
            </div>
            <div v-if="order.paidAt" class="flex items-center justify-between">
              <span class="text-text-muted">付款时间</span>
              <span class="text-text-primary">{{ order.paidAt }}</span>
            </div>
            <div v-if="order.shippedAt" class="flex items-center justify-between">
              <span class="text-text-muted">发货时间</span>
              <span class="text-text-primary">{{ order.shippedAt }}</span>
            </div>
            <div v-if="order.completedAt" class="flex items-center justify-between">
              <span class="text-text-muted">完成时间</span>
              <span class="text-text-primary">{{ order.completedAt }}</span>
            </div>
            <div v-if="order.cancelledAt" class="flex items-center justify-between">
              <span class="text-text-muted">取消时间</span>
              <span class="text-text-primary">{{ order.cancelledAt }}</span>
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-md p-5 flex flex-col gap-3">
          <span class="text-sm font-semibold text-text-primary">客户信息</span>
          <div class="flex flex-col gap-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-text-muted">用户名</span>
              <span class="text-text-primary">{{ order.userName }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-text-muted">邮箱</span>
              <span class="text-text-primary">{{ order.userEmail }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-text-muted">收货地址</span>
              <span class="text-text-primary text-right max-w-[250px]">{{ order.address }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-text-muted">运单号</span>
              <span class="text-text-primary font-mono">{{ order.trackingNo || '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-card border border-border rounded-md overflow-hidden flex flex-col">
        <div class="flex items-center justify-between px-5 py-4 border-b border-border">
          <span class="text-sm font-semibold text-text-primary">商品明细</span>
        </div>
        <div class="flex items-center px-4 bg-table-header h-11 shrink-0">
          <span class="flex-1 text-xs font-semibold text-text-primary">商品</span>
          <span class="w-[100px] text-xs font-semibold text-text-primary text-center">规格</span>
          <span class="w-[80px] text-xs font-semibold text-text-primary text-center">单价</span>
          <span class="w-[60px] text-xs font-semibold text-text-primary text-center">数量</span>
          <span class="w-[80px] text-xs font-semibold text-text-primary text-right">小计</span>
        </div>
        <div class="flex-1">
          <div v-for="item in order.items" :key="item.id"
            class="flex items-center px-4 h-[52px] border-b border-border last:border-b-0">
            <span class="flex-1 text-sm text-text-primary">{{ item.productName || `商品 #${item.productId}` }}</span>
            <span class="w-[100px] text-sm text-text-muted text-center">{{ item.variantLabel }}</span>
            <span class="w-[80px] text-sm text-text-primary text-center">¥{{ item.price }}</span>
            <span class="w-[60px] text-sm text-text-primary text-center">{{ item.quantity }}</span>
            <span class="w-[80px] text-sm text-text-primary font-medium text-right">¥{{ (item.price * item.quantity).toFixed(2) }}</span>
          </div>
        </div>
        <div class="flex items-center justify-end px-5 py-3 border-t border-border">
          <span class="text-sm text-text-muted mr-3">合计：</span>
          <span class="text-base font-bold text-text-primary">¥{{ order.total }}</span>
        </div>
      </div>

      <div v-if="canEdit" class="bg-card border border-border rounded-md p-5 flex flex-col gap-4">
        <span class="text-sm font-semibold text-text-primary">操作</span>
        <div class="flex items-center gap-4 flex-wrap">
          <div class="flex items-center gap-2">
            <label class="text-sm text-text-muted">更新状态</label>
            <div class="relative">
              <select v-model="statusInput"
                class="h-9 rounded border border-border px-3 pr-8 text-sm text-text-primary bg-white outline-none appearance-none cursor-pointer">
                <option v-for="s in allowedTransitions" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
              <ChevronDown :size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-sm text-text-muted">运单号</label>
            <input v-model="trackingInput" type="text" placeholder="输入运单号"
              class="h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors w-[200px]" />
          </div>
          <button
            class="h-9 rounded bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            :disabled="saving" @click="handleUpdate">
            <span v-if="saving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
        <p v-if="updateError" class="text-sm text-danger">{{ updateError }}</p>
      </div>
    </template>

    <div v-else class="flex items-center justify-center h-40">
      <p class="text-sm text-text-muted">订单不存在</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ChevronDown } from 'lucide-vue-next'
import { api } from '@/utils/api'
import { useToast } from '@/composables/useToast'
import StatusBadge from '@/components/ui/StatusBadge.vue'

const route = useRoute()
const router = useRouter()
const { success: toastSuccess, error: toastError } = useToast()

const loading = ref(true)
const saving = ref(false)
const updateError = ref('')
const statusInput = ref('')
const trackingInput = ref('')

interface OrderItem {
  id: number
  productId: number
  variantId: number | null
  designId: number | null
  quantity: number
  price: number
  productName: string | null
  variantLabel?: string
}

interface Order {
  id: number
  userId: number
  status: string
  total: number
  address: string
  paidAt: string | null
  shippedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  trackingNo: string | null
  createdAt: string
  updatedAt: string
  userName: string | null
  userEmail: string | null
  items: OrderItem[]
  orderNo?: string
  statusLabel?: string
}

const order = ref<Order | null>(null)

const statusLabels: Record<string, string> = {
  pending: '待处理',
  paid: '已付款',
  processing: '处理中',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
}

const statusVariantMap: Record<string, string> = {
  pending: 'warning',
  paid: 'info',
  processing: 'primary-light',
  shipped: 'primary',
  completed: 'success',
  cancelled: 'danger',
}

const statusVariant = computed(() => {
  if (!order.value) return 'inactive'
  return (statusVariantMap[order.value.status] ?? 'inactive') as 'warning' | 'info' | 'primary-light' | 'primary' | 'success' | 'danger' | 'inactive'
})

const transitions: Record<string, { value: string; label: string }[]> = {
  pending: [
    { value: 'pending', label: '待处理' },
    { value: 'paid', label: '标记已付款' },
    { value: 'cancelled', label: '取消订单' },
  ],
  paid: [
    { value: 'paid', label: '已付款' },
    { value: 'processing', label: '开始处理' },
    { value: 'shipped', label: '标记已发货' },
    { value: 'cancelled', label: '取消订单' },
  ],
  processing: [
    { value: 'processing', label: '处理中' },
    { value: 'shipped', label: '标记已发货' },
    { value: 'cancelled', label: '取消订单' },
  ],
  shipped: [
    { value: 'shipped', label: '已发货' },
    { value: 'completed', label: '标记已完成' },
  ],
  completed: [],
  cancelled: [],
}

const allowedTransitions = computed(() => {
  if (!order.value) return []
  return transitions[order.value.status] ?? []
})

const canEdit = computed(() => allowedTransitions.value.length > 0)

async function fetchOrder() {
  loading.value = true
  const id = route.params.id
  const res = await api.get<Order>(`/admin/orders/${id}`)
  if (res.success && res.data) {
    const d = res.data
    d.orderNo = `ORD-${String(d.id).padStart(5, '0')}`
    d.statusLabel = statusLabels[d.status] ?? d.status
    d.createdAt = d.createdAt?.slice(0, 19).replace('T', ' ') ?? ''
    d.paidAt = d.paidAt?.slice(0, 19).replace('T', ' ') ?? null
    d.shippedAt = d.shippedAt?.slice(0, 19).replace('T', ' ') ?? null
    d.completedAt = d.completedAt?.slice(0, 19).replace('T', ' ') ?? null
    d.cancelledAt = d.cancelledAt?.slice(0, 19).replace('T', ' ') ?? null
    d.items = (d.items ?? []).map((item: OrderItem) => ({
      ...item,
      variantLabel: item.variantId ? `变体 #${item.variantId}` : '默认',
    }))
    order.value = d
    statusInput.value = d.status
    trackingInput.value = d.trackingNo ?? ''
  } else {
    order.value = null
  }
  loading.value = false
}

async function handleUpdate() {
  if (!order.value) return
  updateError.value = ''
  saving.value = true
  const payload: Record<string, unknown> = {
    status: statusInput.value,
  }
  if (trackingInput.value) {
    payload.trackingNo = trackingInput.value
  }
  const res = await api.put(`/admin/orders/${order.value.id}`, payload)
  saving.value = false
  if (res.success) {
    toastSuccess('操作成功')
    await fetchOrder()
  } else {
    updateError.value = res.error || '操作失败'
  }
}

onMounted(fetchOrder)
</script>
