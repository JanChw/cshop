<template>
  <div class="p-6 flex flex-col gap-4 min-h-screen">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          class="w-8 h-8 rounded border border-border bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
          @click="$router.push('/products')"
        >
          <ChevronLeft :size="16" />
        </button>
        <h1 class="text-xl font-bold text-text-primary">回收站</h1>
        <span v-if="total > 0" class="text-sm text-text-muted">共 {{ total }} 个已删除商品</span>
      </div>
      <button
        v-if="total > 0"
        class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors flex items-center gap-2"
        @click="askEmptyTrash"
      >
        <Trash2 :size="14" />
        清空回收站
      </button>
    </div>

    <div class="flex items-center gap-3">
      <SearchInput
        v-model="searchQuery"
        size="sm"
        placeholder="搜索商品名称"
        aria-label="搜索商品名称"
        wrapper-class="w-[320px]"
      />
    </div>

    <div v-if="selected.size > 0" class="flex items-center justify-between bg-info-light border border-info/30 rounded-md px-4 h-12">
      <span class="text-sm text-text-primary">已选 <strong>{{ selected.size }}</strong> 项</span>
      <div class="flex items-center gap-2">
        <button
          class="h-8 rounded border border-border bg-white px-3 text-sm text-text-primary hover:bg-gray-50 transition-colors"
          @click="selected.clear()"
        >
          清空选择
        </button>
        <button
          class="h-8 rounded bg-danger px-3 text-sm font-medium text-white hover:bg-danger/90 transition-colors"
          @click="askBatchHardDelete"
        >
          彻底删除选中
        </button>
      </div>
    </div>

    <div class="flex-1 bg-card border border-border rounded-md overflow-hidden flex flex-col">
      <div class="flex items-center px-4 bg-table-header h-11 shrink-0 gap-3">
        <div class="w-[40px] flex items-center">
          <input
            type="checkbox"
            class="w-4 h-4 rounded border-border text-primary cursor-pointer"
            :checked="allOnPageSelected"
            :indeterminate="someOnPageSelected && !allOnPageSelected"
            @change="toggleAll"
          >
        </div>
        <span class="w-[50px] text-xs font-semibold text-text-primary">ID</span>
        <span class="w-[200px] text-xs font-semibold text-text-primary">商品名称</span>
        <span class="w-[80px] text-xs font-semibold text-text-primary">分类</span>
        <span class="w-[80px] text-xs font-semibold text-text-primary">价格</span>
        <span class="w-[70px] text-xs font-semibold text-text-primary">库存</span>
        <span class="w-[120px] text-xs font-semibold text-text-primary">删除时间</span>
        <span class="w-[140px] text-xs font-semibold text-text-primary">操作</span>
      </div>

      <div ref="tableBodyRef" class="flex-1 overflow-auto">
        <div v-if="loading" class="flex items-center justify-center h-40">
          <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <template v-else>
          <div
            v-for="product in paginatedProducts"
            :key="product.id"
            class="flex items-center px-4 h-[52px] border-b border-border gap-3"
          >
          <div class="w-[40px] flex items-center">
            <input
              type="checkbox"
              class="w-4 h-4 rounded border-border text-primary cursor-pointer"
              :checked="selected.has(product.id)"
              @change="toggleOne(product.id)"
            >
          </div>
          <span class="w-[50px] text-sm text-text-primary">{{ product.id }}</span>
          <span class="w-[200px] text-sm text-text-primary font-medium truncate">{{ product.name }}</span>
          <span class="w-[80px] text-sm text-text-primary">{{ product.category }}</span>
          <span class="w-[80px] text-sm text-text-primary font-medium">{{ product.price }}</span>
          <span class="w-[70px] text-sm text-text-primary">{{ product.stock }}</span>
          <span class="w-[120px] text-sm text-text-muted">{{ product.deletedRel }}</span>
          <div class="w-[140px] flex items-center gap-3">
            <button
              class="text-sm text-primary hover:underline"
              @click="restore(product)"
            >
              恢复
            </button>
            <button
              class="text-sm text-danger hover:underline"
              @click="askHardDelete(product)"
            >
              彻底删除
            </button>
          </div>
          </div>
        </template>

        <div v-if="paginatedProducts.length === 0 && !loading" class="flex items-center justify-center h-40 text-sm text-text-muted">
          回收站是空的
        </div>
      </div>
    </div>

    <Pagination
      :current-page="currentPage"
      :total-pages="totalPages"
      :total="total"
      :per-page="8"
      @update:current-page="currentPage = $event"
    />

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="confirmVisible"
          class="fixed inset-0 z-50 flex items-center justify-center"
          @click.self="confirmVisible = false"
        >
          <div class="absolute inset-0 bg-black/50" />
          <div class="relative glass rounded-md w-[420px] border border-border p-7 flex flex-col gap-5">
            <h3 class="text-base font-semibold text-text-primary">
              {{ confirmTitle }}
            </h3>
            <p class="text-sm text-text-muted">{{ confirmBody }}</p>
            <div class="flex items-center justify-end gap-3">
              <button
                class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
                @click="confirmVisible = false"
              >
                取消
              </button>
              <button
                class="h-10 rounded bg-danger px-4 text-sm font-medium text-white hover:bg-danger/90 transition-colors"
                @click="confirmAction"
              >
                {{ confirmActionLabel }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { api } from '@/utils/api'
import { Trash2 } from 'lucide-vue-next'
import SearchInput from '@/components/ui/SearchInput.vue'
import Pagination from '@/components/ui/Pagination.vue'
import gsap from 'gsap'
import { useToast } from '@/composables/useToast'

const toast = useToast()

const searchQuery = ref('')
const currentPage = ref(1)
const loading = ref(false)
const selected = ref<Set<number>>(new Set())

interface TrashProduct {
  id: number
  name: string
  category: string
  price: string
  stock: number
  deletedAt: string | null
  deletedRel: string
}

const products = ref<TrashProduct[]>([])
const total = ref(0)

const confirmVisible = ref(false)
const confirmTitle = ref('')
const confirmBody = ref('')
const confirmActionLabel = ref('确认')
const confirmAction = ref<() => Promise<void>>(async () => {})

function relTime(t: string | null): string {
  if (!t) return ''
  const ms = Date.now() - new Date(t.replace(' ', 'T') + 'Z').getTime()
  if (Number.isNaN(ms)) return t
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return '刚刚'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} 分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小时前`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} 天前`
  return new Date(t.replace(' ', 'T') + 'Z').toLocaleDateString('zh-CN')
}

async function fetchProducts() {
  loading.value = true
  try {
    const res = await api.get<{
      items: Array<{ id: number; name: string; basePrice: number; categoryId: number; categoryName: string; stock: number; deletedAt: string | null }>
      total: number
    }>('/admin/products', {
      page: currentPage.value,
      limit: 8,
      q: searchQuery.value,
      onlyDeleted: true,
    })
    if (res.success && res.data) {
      products.value = res.data.items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.categoryName || '—',
        price: `¥${item.basePrice}`,
        stock: item.stock,
        deletedAt: item.deletedAt,
        deletedRel: relTime(item.deletedAt),
      }))
      total.value = res.data.total
      selected.value.clear()
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const totalPages = computed(() => Math.ceil(total.value / 8) || 1)
const paginatedProducts = computed(() => products.value)
const pageIds = computed(() => paginatedProducts.value.map(p => p.id))
const allOnPageSelected = computed(() => pageIds.value.length > 0 && pageIds.value.every(id => selected.value.has(id)))
const someOnPageSelected = computed(() => pageIds.value.some(id => selected.value.has(id)))

function toggleOne(id: number) {
  if (selected.value.has(id)) selected.value.delete(id)
  else selected.value.add(id)
  selected.value = new Set(selected.value)
}

function toggleAll() {
  if (allOnPageSelected.value) {
    pageIds.value.forEach(id => selected.value.delete(id))
  } else {
    pageIds.value.forEach(id => selected.value.add(id))
  }
  selected.value = new Set(selected.value)
}

async function restore(p: TrashProduct) {
  const res = await api.post(`/admin/products/${p.id}/restore`)
  if (res.success) {
    toast.success('已恢复商品')
    await fetchProducts()
  } else {
    toast.error(res.error || '恢复失败')
  }
}

function askHardDelete(p: TrashProduct) {
  confirmTitle.value = '彻底删除商品'
  confirmBody.value = `确认彻底删除「${p.name}」？此操作不可撤销，且该商品无订单/购物车引用时才能删除。`
  confirmActionLabel.value = '彻底删除'
  confirmAction.value = async () => {
    const res = await api.post(`/admin/products/${p.id}/permanent`)
    confirmVisible.value = false
    if (res.success) {
      toast.success('已彻底删除')
      await fetchProducts()
    } else {
      toast.error(res.error || '删除失败')
    }
  }
  confirmVisible.value = true
}

function askBatchHardDelete() {
  confirmTitle.value = '彻底删除商品（不可恢复）'
  confirmBody.value = `确认彻底删除选中的 ${selected.value.size} 个商品？此操作不可撤销。`
  confirmActionLabel.value = '彻底删除'
  confirmAction.value = async () => {
    const ids = [...selected.value]
    const res = await api.post<{ count: number }>('/admin/products/batch-permanent', { ids })
    confirmVisible.value = false
    if (res.success) {
      toast.success(`已彻底删除 ${res.data?.count ?? ids.length} 个商品`)
      await fetchProducts()
    } else {
      toast.error(res.error || '删除失败')
    }
  }
  confirmVisible.value = true
}

function askEmptyTrash() {
  confirmTitle.value = '清空回收站（不可恢复）'
  confirmBody.value = `确认清空回收站中的全部 ${total.value} 个商品？此操作不可撤销。`
  confirmActionLabel.value = '清空回收站'
  confirmAction.value = async () => {
    const res = await api.post<{ count: number }>('/admin/products/batch-permanent', {
      ids: products.value.map(p => p.id)
    })
    confirmVisible.value = false
    if (res.success) {
      toast.success(`已清空回收站 (${res.data?.count ?? 0} 个)`)
      await fetchProducts()
    } else {
      toast.error(res.error || '清空失败')
    }
  }
  confirmVisible.value = true
}

const tableBodyRef = ref<HTMLElement | null>(null)

watch([searchQuery, currentPage], () => {
  fetchProducts()
  nextTick(() => {
    const rows = tableBodyRef.value?.querySelectorAll('.border-b')
    if (rows?.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.from(rows, { opacity: 0, duration: 0.2, stagger: 0.02, ease: 'power2.out' })
    }
  })
})

onMounted(() => {
  fetchProducts()
})
</script>
