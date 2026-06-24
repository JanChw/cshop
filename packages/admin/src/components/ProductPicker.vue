<template>
  <div class="border border-border rounded-md flex flex-col">
    <div class="p-3 border-b border-border bg-surface">
      <input
        v-model="search"
        type="text"
        placeholder="搜索商品名称..."
        class="w-full h-8 rounded border border-border px-2 text-sm outline-none focus:border-primary"
      />
    </div>
    <div class="flex" style="min-height: 200px; max-height: 350px;">
      <div class="flex-1 border-r border-border overflow-y-auto">
        <div
          v-for="p in filteredAvailable"
          :key="p.id"
          class="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-border/50"
          @click="addItem(p)"
        >
          <img v-if="p.image" :src="p.image" class="w-8 h-8 rounded object-cover shrink-0" />
          <div v-else class="w-8 h-8 rounded bg-gray-100 shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-text-primary truncate">{{ p.name }}</p>
            <p class="text-xs text-text-muted">&yen;{{ p.basePrice }}</p>
          </div>
          <Plus :size="14" class="text-text-muted shrink-0" />
        </div>
        <div v-if="filteredAvailable.length === 0" class="flex items-center justify-center h-20 text-sm text-text-muted">无可用商品</div>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div v-if="items.length === 0" class="flex items-center justify-center h-20 text-sm text-text-muted">点击左侧商品添加</div>
        <div
          v-for="(it, idx) in items" :key="idx"
          draggable="true"
          class="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 border-b border-border/50 select-none"
          :class="dragIdx === idx ? 'opacity-50' : ''"
          @dragstart="dragStart(idx)" @dragover.prevent="dragOver = idx"
          @dragenter.prevent="dragOver = idx" @dragleave="dragOver = null"
          @drop="drop(idx)" @dragend="dragEnd"
        >
          <GripVertical :size="12" class="text-text-muted shrink-0 cursor-grab" />
          <div class="flex-1 min-w-0">
            <template v-if="type === 'designer_grid'">
              <input v-model="it.name" type="text" placeholder="设计师名" class="w-full h-7 rounded border border-border px-1.5 text-xs outline-none focus:border-primary mb-1" />
              <input v-model="it.series" type="text" placeholder="系列名" class="w-full h-7 rounded border border-border px-1.5 text-xs outline-none focus:border-primary" />
            </template>
            <template v-else-if="type === 'card_grid'">
              <input v-model="it.title" type="text" placeholder="卡片标题" class="w-full h-7 rounded border border-border px-1.5 text-xs outline-none focus:border-primary mb-1" />
              <input v-model="it.subtitle" type="text" placeholder="副标题 (可选)" class="w-full h-7 rounded border border-border px-1.5 text-xs outline-none focus:border-primary" />
            </template>
            <div v-else class="text-xs text-text-muted truncate">{{ getProductName(it.productId) }}</div>
          </div>
          <button class="text-danger hover:bg-red-50 rounded p-0.5 shrink-0" @click="removeItem(idx)">
            <X :size="12" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Plus, X, GripVertical } from 'lucide-vue-next'
import { api } from '@/utils/api'

interface ContentItem {
  productId: number | null
  cover?: string | null
  title?: string
  subtitle?: string
  name?: string
  series?: string
}
interface ProductSummary { id: number; name: string; basePrice: number; image: string | null }

const props = defineProps<{
  modelValue: ContentItem[]
  type?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [val: ContentItem[]] }>()

const type = computed(() => props.type || 'product_row')
const items = ref<ContentItem[]>([...props.modelValue])
const products = ref<ProductSummary[]>([])
const search = ref('')
const dragIdx = ref<number | null>(null)
const dragOver = ref<number | null>(null)

watch(() => props.modelValue, (val) => { items.value = [...val] }, { deep: true })

const selectedIds = computed(() => new Set(items.value.map(i => i.productId).filter(Boolean)))
const filteredAvailable = computed(() =>
  products.value.filter(p => !selectedIds.value.has(p.id) && (!search.value || p.name.includes(search.value)))
)

function getProductName(id: number | null) {
  return products.value.find(p => p.id === id)?.name ?? (id ? `#${id}` : '(无关联商品)')
}

function addItem(p: ProductSummary) {
  items.value.push({ productId: p.id, cover: null })
  emit('update:modelValue', [...items.value])
}

function removeItem(idx: number) {
  items.value.splice(idx, 1)
  emit('update:modelValue', [...items.value])
}

function dragStart(idx: number) { dragIdx.value = idx }
function dragEnd() { dragIdx.value = null; dragOver.value = null }
function drop(idx: number) {
  if (dragIdx.value === null || dragIdx.value === idx) { dragEnd(); return }
  const item = items.value.splice(dragIdx.value, 1)[0]
  items.value.splice(idx, 0, item)
  dragEnd()
  emit('update:modelValue', [...items.value])
}

onMounted(async () => {
  const res = await api.get<{ items: ProductSummary[] }>('/admin/products', { includeInactive: false, limit: 200 })
  if (res.success && res.data) {
    products.value = res.data.items || []
  }
})
</script>
