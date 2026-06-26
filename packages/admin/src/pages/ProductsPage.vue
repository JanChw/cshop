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
          class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors flex items-center gap-2"
          @click="handleExport"
        >
          <Download :size="14" />
          导出
        </button>
        <button
          class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors flex items-center gap-2"
          @click="showImport = true"
        >
          <Upload :size="14" />
          导入
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
          <span class="w-[200px] text-sm text-text-primary font-medium">{{ product.name }}</span>
          <span class="w-[80px] text-sm text-text-primary">{{ product.category }}</span>
          <span class="w-[80px] text-sm text-text-primary font-medium">{{ product.price }}</span>
          <span class="w-[70px] text-sm text-text-primary">{{ product.stock }}</span>
          <span class="w-[70px]">
            <button
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
              :class="product.isActive ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 hover:bg-gray-500'"
              :disabled="toggling.has(product.id)"
              @click="toggleStatus(product)"
            >
              {{ product.status }}
            </button>
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
        </template>
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

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showImport" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="showImport = false">
          <div class="absolute inset-0 bg-black/50" />
          <div class="relative bg-white rounded-lg w-[520px] shadow-lg flex flex-col">
            <div class="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 class="text-base font-semibold text-text-primary">导入商品</h2>
              <button class="rounded p-1 text-text-muted hover:text-text-primary transition-colors" @click="showImport = false">
                <X :size="18" />
              </button>
            </div>
            <div class="px-6 py-6 flex flex-col gap-5">
              <div v-if="importResult" class="flex flex-col gap-3">
                <div class="rounded-lg bg-success/10 border border-success/30 px-4 py-3 text-sm">
                  成功导入 <strong class="text-success">{{ importResult.imported }}</strong> / {{ importResult.total }} 条记录
                </div>
                <div v-if="importResult.errors?.length" class="flex flex-col gap-1 max-h-[200px] overflow-auto">
                  <span class="text-xs font-medium text-text-muted">错误详情（{{ importResult.errors.length }} 条）：</span>
                  <div v-for="(err, i) in importResult.errors" :key="i" class="text-xs text-danger bg-red-50 rounded px-2 py-1">
                    {{ err }}
                  </div>
                  <span v-if="importResult.hasMoreErrors" class="text-xs text-text-muted">...还有更多错误</span>
                </div>
                <button class="h-9 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors self-start" @click="importResult = null; showImport = false">
                  关闭
                </button>
              </div>
              <div v-else class="flex flex-col gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-text-primary">选择 CSV 文件</label>
                  <p class="text-xs text-text-muted">文件格式：CSV（UTF-8），表头为 ID,名称,价格,库存,状态,分类,描述,标签,面料,版型,设计师,规格</p>
                </div>
                <div
                  class="border-2 border-dashed border-border rounded-md p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary transition-colors"
                  :class="{ 'border-primary bg-primary/5': dragOver }"
                  @dragover.prevent="dragOver = true"
                  @dragleave.prevent="dragOver = false"
                  @drop.prevent="handleDrop"
                  @click="fileInput?.click()"
                >
                  <Upload :size="32" class="text-text-muted" />
                  <span class="text-sm text-text-muted">拖拽文件到此处，或点击选择</span>
                  <span v-if="selectedFile" class="text-sm text-text-primary font-medium">{{ selectedFile.name }}</span>
                </div>
                <input ref="fileInput" type="file" accept=".csv" class="hidden" @change="handleFileChange" />
                <div v-if="importError" class="text-sm text-danger">{{ importError }}</div>
                <div class="flex items-center justify-end gap-3">
                  <button class="rounded px-4 py-2 text-sm font-medium text-text-primary border border-border hover:bg-gray-50 transition-colors" @click="showImport = false">取消</button>
                  <button class="rounded px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2" :disabled="!selectedFile || importing" @click="handleImport">
                    <span v-if="importing" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {{ importing ? '导入中...' : '开始导入' }}
                  </button>
                </div>
              </div>
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
import { Search, ChevronDown, ChevronLeft, ChevronRight, Trash2, Download, Upload, X } from 'lucide-vue-next'
import gsap from 'gsap'
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
const toggling = ref<Set<number>>(new Set())

const showImport = ref(false)
const importing = ref(false)
const importError = ref('')
const selectedFile = ref<File | null>(null)
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const importResult = ref<{ imported: number; total: number; errors: string[]; hasMoreErrors: boolean } | null>(null)

async function handleExport() {
  const token = localStorage.getItem('cshop_admin_token')
  if (!token) return
  try {
    const res = await fetch('/api/v1/admin/products/export', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      toast.error(text ? `导出失败: ${text}` : '导出失败')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err: unknown) {
    toast.error(`导出失败: ${err instanceof Error ? err.message : '未知错误'}`)
  }
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files?.[0]) {
    selectedFile.value = target.files[0]
    importError.value = ''
  }
}

function handleDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.name.endsWith('.csv')) {
    selectedFile.value = file
    importError.value = ''
  } else {
    importError.value = '请上传 CSV 文件'
  }
}

async function handleImport() {
  if (!selectedFile.value) return
  importing.value = true
  importError.value = ''

  const formData = new FormData()
  formData.append('file', selectedFile.value)

  const res = await api.upload<{ imported: number; total: number; errors: string[]; hasMoreErrors: boolean }>(
    '/admin/products/import', formData
  )
  importing.value = false
  if (res.success && res.data) {
    importResult.value = res.data
    await fetchProducts()
    await fetchTrashCount()
    selectedFile.value = null
    if (fileInput.value) fileInput.value.value = ''
  } else {
    importError.value = res.error || '导入失败'
  }
}

interface Product {
  id: number
  name: string
  category: string
  price: string
  stock: number
  status: string
  isActive: boolean
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
        isActive: item.isActive,
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

async function toggleStatus(product: Product) {
  const newStatus = !product.isActive
  toggling.value = new Set([...toggling.value, product.id])
  const res = await api.patch(`/admin/products/${product.id}/status`, { isActive: newStatus })
  toggling.value = new Set([...toggling.value].filter(id => id !== product.id))
  if (res.success) {
    product.isActive = newStatus
    product.status = newStatus ? '上架' : '下架'
  } else {
    toast.error(res.error || '操作失败')
  }
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
