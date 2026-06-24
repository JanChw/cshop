<template>
  <div class="p-6 flex flex-col gap-4 min-h-screen">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-text-primary">商品管理</h1>
      <div class="flex items-center gap-3">
        <button
          class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors flex items-center gap-2"
          @click="$router.push('/products/trash')"
        >
          <Trash2 :size="14" />
          回收站
          <span v-if="trashCount > 0" class="bg-danger text-white text-xs px-1.5 py-0.5 rounded-full">{{ trashCount }}</span>
        </button>
        <button
          class="h-10 rounded bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          @click="$router.push('/products/new')"
        >
          新增商品
        </button>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 w-[320px] h-10 rounded border border-border px-3 bg-white focus-within:border-primary transition-colors">
        <Search :size="16" class="text-text-muted shrink-0" />
        <input
          v-model="searchQuery"
          type="text"
          aria-label="搜索商品名称"
          placeholder="搜索商品名称"
          class="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
        />
      </div>

      <div class="relative">
        <select
          v-model="categoryFilter"
          class="h-10 rounded border border-border px-3 pr-8 text-sm text-text-primary bg-white outline-none appearance-none cursor-pointer"
        >
          <option value="">全部分类</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        <ChevronDown :size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>

      <div class="relative">
        <select
          v-model="statusFilter"
          class="h-10 rounded border border-border px-3 pr-8 text-sm text-text-primary bg-white outline-none appearance-none cursor-pointer appearance-none"
        >
          <option value="">全部状态</option>
          <option value="上架">上架</option>
          <option value="下架">下架</option>
        </select>
        <ChevronDown :size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>
    </div>

    <div v-if="selected.size > 0" class="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-4 h-12">
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
          @click="askBatchDelete"
        >
          批量移入回收站
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
        <span class="w-[70px] text-xs font-semibold text-text-primary">状态</span>
        <span class="w-[120px] text-xs font-semibold text-text-primary">操作</span>
      </div>

      <div ref="tableBodyRef" class="flex-1 overflow-auto">
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
          <span class="w-[200px] text-sm text-text-primary font-medium">{{ product.name }}</span>
          <span class="w-[80px] text-sm text-text-primary">{{ product.category }}</span>
          <span class="w-[80px] text-sm text-text-primary font-medium">{{ product.price }}</span>
          <span class="w-[70px] text-sm text-text-primary">{{ product.stock }}</span>
          <span class="w-[70px]">
            <StatusBadge :label="product.status" :variant="product.status === '上架' ? 'active' : 'inactive'" />
          </span>
          <div class="w-[120px] flex items-center gap-3">
            <button
              class="text-sm text-primary hover:underline"
              @click="$router.push(`/products/${product.id}/edit`)"
            >
              编辑
            </button>
            <button
              class="text-sm text-danger hover:underline"
              @click="askDelete(product)"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <span class="text-sm text-text-muted">共 {{ filteredProducts.length }} 条，每页 8 条</span>
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
      <Transition name="modal">
        <div
          v-if="confirmVisible"
          class="fixed inset-0 z-50 flex items-center justify-center"
          @click.self="confirmVisible = false"
        >
          <div class="absolute inset-0 bg-black/50" />
          <div class="relative glass rounded-md w-[420px] border border-border p-7 flex flex-col gap-5">
            <h3 class="text-base font-semibold text-text-primary">
              {{ pendingBatch ? '批量移入回收站' : '确认删除' }}
            </h3>
            <p class="text-sm text-text-muted">
              <template v-if="pendingBatch">
                确认将选中的 <strong class="text-text-primary">{{ selected.size }}</strong> 个商品移入回收站？
              </template>
              <template v-else>
                确定要删除商品
                <span v-if="pending" class="font-medium text-text-primary">
                  {{ pending.name }}
                </span>
                吗？商品可在回收站中恢复。
              </template>
            </p>
            <div class="flex items-center justify-end gap-3">
              <button
                class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
                @click="confirmVisible = false"
              >
                取消
              </button>
              <button
                class="h-10 rounded bg-danger px-4 text-sm font-medium text-white hover:bg-danger/90 transition-colors"
                @click="confirmDelete"
              >
                确认删除
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
import { Search, ChevronDown, ChevronLeft, ChevronRight, Trash2 } from 'lucide-vue-next'
import gsap from 'gsap'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useToast } from '@/composables/useToast'

const toast = useToast()

const searchQuery = ref('')
const categoryFilter = ref<number | ''>('')
const statusFilter = ref('')
const currentPage = ref(1)
const loading = ref(false)
const trashCount = ref(0)
const selected = ref<Set<number>>(new Set())
const confirmVisible = ref(false)
const pending = ref<Product | undefined>(undefined)
const pendingBatch = ref(false)

interface Product {
  id: number
  name: string
  category: string
  price: string
  stock: number
  status: string
}

const products = ref<Product[]>([])
const total = ref(0)
const categories = ref<{ id: number; name: string }[]>([])

async function fetchCategories() {
  const res = await api.get<{ items: { id: number; name: string }[] }>('/categories')
  if (res.success && res.data) {
    categories.value = res.data.items || []
  }
}

async function fetchTrashCount() {
  const res = await api.get<{ total: number }>('/admin/products', { onlyDeleted: true, limit: 1 })
  if (res.success && res.data) {
    trashCount.value = res.data.total
  }
}

async function fetchProducts() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      limit: 8,
      q: searchQuery.value,
      includeInactive: true,
    }
    if (categoryFilter.value) params.categoryId = categoryFilter.value
    const res = await api.get<{
      items: Array<{ id: number; name: string; basePrice: number; categoryId: number; categoryName: string; stock: number; isActive: boolean; images: string[] }>
      total: number
      page: number
      limit: number
    }>('/admin/products', params)
    if (res.success && res.data) {
      products.value = res.data.items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.categoryName,
        price: `¥${item.basePrice}`,
        stock: item.stock,
        status: item.isActive ? '上架' : '下架',
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

const filteredProducts = computed(() => {
  return products.value.filter((p) => {
    return !statusFilter.value || p.status === statusFilter.value
  })
})

const totalPages = computed(() => Math.ceil(total.value / 8) || 1)
const paginatedProducts = computed(() => filteredProducts.value)
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

function askDelete(p: Product) {
  pending.value = p
  pendingBatch.value = false
  confirmVisible.value = true
}

function askBatchDelete() {
  pending.value = undefined
  pendingBatch.value = true
  confirmVisible.value = true
}

async function confirmDelete() {
  if (pendingBatch.value) {
    const ids = [...selected.value]
    const res = await api.post<{ count: number }>('/admin/products/batch-delete', { ids })
    confirmVisible.value = false
    if (res.success) {
      toast.success(`已将 ${res.data?.count ?? ids.length} 个商品移入回收站`)
      await Promise.all([fetchProducts(), fetchTrashCount()])
    } else {
      toast.error(res.error || '操作失败')
    }
    return
  }
  if (!pending.value) return
  const id = pending.value.id
  const res = await api.delete(`/admin/products/${id}`)
  confirmVisible.value = false
  if (res.success) {
    toast.success('已移入回收站')
    await Promise.all([fetchProducts(), fetchTrashCount()])
  } else {
    toast.error(res.error || '删除失败')
  }
}

const tableBodyRef = ref<HTMLElement | null>(null)

watch([searchQuery, categoryFilter, statusFilter, currentPage], () => {
  nextTick(() => {
    const rows = tableBodyRef.value?.querySelectorAll('.border-b')
    if (rows?.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.from(rows, { opacity: 0, duration: 0.2, stagger: 0.02, ease: 'power2.out' })
    }
  })
})

watch([searchQuery, categoryFilter], () => {
  currentPage.value = 1
})

watch([searchQuery, categoryFilter, currentPage], () => {
  fetchProducts()
})

onMounted(() => {
  fetchCategories()
  fetchProducts()
  fetchTrashCount()
})
</script>
