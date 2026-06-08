<template>
  <div class="p-6 flex flex-col gap-4 h-full">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-text-primary">商品管理</h1>
      <div class="flex items-center gap-3">
        <button class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors">
          导出
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
      <div class="flex items-center gap-2 w-[320px] h-10 rounded border border-border px-3 bg-white">
        <Search :size="16" class="text-text-muted shrink-0" />
        <input
          v-model="searchQuery"
          type="text"
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
          <option value="服装">服装</option>
          <option value="鞋类">鞋类</option>
          <option value="配饰">配饰</option>
        </select>
        <ChevronDown :size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>

      <div class="relative">
        <select
          v-model="statusFilter"
          class="h-10 rounded border border-border px-3 pr-8 text-sm text-text-primary bg-white outline-none appearance-none cursor-pointer"
        >
          <option value="">全部状态</option>
          <option value="上架">上架</option>
          <option value="下架">下架</option>
        </select>
        <ChevronDown :size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>
    </div>

    <div class="flex-1 bg-card border border-border rounded-md overflow-hidden flex flex-col">
      <div class="flex items-center px-4 bg-[#F9FAFB] h-11 shrink-0 gap-3">
        <span class="w-[50px] text-xs font-semibold text-text-primary">ID</span>
        <span class="w-[200px] text-xs font-semibold text-text-primary">商品名称</span>
        <span class="w-[80px] text-xs font-semibold text-text-primary">分类</span>
        <span class="w-[80px] text-xs font-semibold text-text-primary">价格</span>
        <span class="w-[70px] text-xs font-semibold text-text-primary">库存</span>
        <span class="w-[70px] text-xs font-semibold text-text-primary">状态</span>
        <span class="w-[100px] text-xs font-semibold text-text-primary">操作</span>
      </div>

      <div class="flex-1 overflow-auto">
        <div
          v-for="product in paginatedProducts"
          :key="product.id"
          class="flex items-center px-4 h-12 border-b border-border gap-3"
        >
          <span class="w-[50px] text-[13px] text-text-primary">{{ product.id }}</span>
          <span class="w-[200px] text-[13px] text-text-primary font-medium">{{ product.name }}</span>
          <span class="w-[80px] text-[13px] text-text-primary">{{ product.category }}</span>
          <span class="w-[80px] text-[13px] text-text-primary font-medium">{{ product.price }}</span>
          <span class="w-[70px] text-[13px] text-text-primary">{{ product.stock }}</span>
          <span class="w-[70px]">
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
              :class="product.status === '上架' ? 'bg-[#10B981]' : 'bg-gray-400'"
            >
              {{ product.status }}
            </span>
          </span>
          <div class="w-[100px]">
            <button
              class="text-[13px] text-primary hover:underline"
              @click="$router.push(`/products/${product.id}/edit`)"
            >
              编辑
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <span class="text-[13px] text-text-primary">共 {{ filteredProducts.length }} 条，每页 8 条</span>
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
import { Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const searchQuery = ref('')
const categoryFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)

interface Product {
  id: number
  name: string
  category: string
  price: string
  stock: number
  status: string
}

const products = ref<Product[]>([
  { id: 1, name: '经典款 T 恤', category: '服装', price: '¥199', stock: 156, status: '上架' },
  { id: 2, name: '潮流连帽卫衣', category: '服装', price: '¥399', stock: 89, status: '上架' },
  { id: 3, name: '修身牛仔裤', category: '服装', price: '¥299', stock: 67, status: '上架' },
  { id: 4, name: '纯棉 Polo 衫', category: '服装', price: '¥149', stock: 234, status: '上架' },
  { id: 5, name: '加绒外套', category: '服装', price: '¥459', stock: 45, status: '下架' },
  { id: 6, name: '运动鞋', category: '鞋类', price: '¥599', stock: 123, status: '上架' },
  { id: 7, name: '休闲板鞋', category: '鞋类', price: '¥349', stock: 78, status: '上架' },
  { id: 8, name: '时尚太阳镜', category: '配饰', price: '¥199', stock: 56, status: '上架' },
  { id: 9, name: '真皮腰带', category: '配饰', price: '¥129', stock: 189, status: '上架' },
  { id: 10, name: '运动短裤', category: '服装', price: '¥179', stock: 0, status: '下架' },
  { id: 11, name: '帆布鞋', category: '鞋类', price: '¥259', stock: 92, status: '上架' },
  { id: 12, name: '棒球帽', category: '配饰', price: '¥89', stock: 312, status: '上架' },
])

const filteredProducts = computed(() => {
  return products.value.filter((p) => {
    const matchSearch = !searchQuery.value ||
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCategory = !categoryFilter.value || p.category === categoryFilter.value
    const matchStatus = !statusFilter.value || p.status === statusFilter.value
    return matchSearch && matchCategory && matchStatus
  })
})

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / 8) || 1)

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * 8
  return filteredProducts.value.slice(start, start + 8)
})
</script>
