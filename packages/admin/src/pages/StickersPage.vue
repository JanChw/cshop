<template>
  <div class="p-6 flex flex-col gap-4 min-h-screen">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-text-primary">系统贴纸管理</h1>
      <button
        class="rounded bg-primary text-white text-sm font-medium h-9 px-3 flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
        @click="openUpload"
      >
        <Plus :size="14" />
        上传贴纸
      </button>
    </div>

    <div class="flex gap-2 flex-wrap">
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="rounded h-9 px-4 text-sm font-medium transition-colors"
        :class="activeCategory === cat.key ? 'bg-primary text-white' : 'bg-card text-text-primary hover:bg-gray-100'"
        @click="activeCategory = cat.key"
      >
        {{ cat.label }}
      </button>
    </div>

    <div class="bg-card border border-border rounded-md overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center h-40">
        <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <div v-else-if="filteredItems.length === 0" class="flex items-center justify-center h-32 text-sm text-text-muted">
        暂无贴纸
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="group relative bg-card rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow"
        >
          <div class="aspect-square bg-background flex items-center justify-center p-4">
            <img
              :src="item.url"
              :alt="item.name"
              class="max-w-full max-h-full object-contain"
              loading="lazy"
            />
          </div>
          <div class="p-3">
            <p class="text-sm font-medium text-text-primary truncate">{{ item.name }}</p>
            <p class="text-xs text-text-muted mt-0.5">{{ item.width }}×{{ item.height }}</p>
          </div>
          <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              class="rounded p-1.5 bg-white/90 backdrop-blur-sm text-text-muted hover:text-text-primary transition-colors shadow-sm"
              @click="openEdit(item)"
              title="编辑"
            >
              <Pencil :size="14" />
            </button>
            <button
              class="rounded p-1.5 bg-white/90 backdrop-blur-sm text-danger hover:bg-red-50 transition-colors shadow-sm"
              @click="handleDelete(item)"
              title="删除"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <StickerModal
      :visible="modalVisible"
      :sticker="editingSticker"
      @close="closeModal"
      @save="handleSave"
    />

    <ConfirmModal
      :visible="confirmVisible"
      :title="confirmTitle"
      variant="danger"
      confirm-label="确认删除"
      @confirm="doDelete"
      @cancel="confirmVisible = false"
    >
      {{ confirmMessage }}
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'
import { api } from '@/utils/api'
import { useToast } from '@/composables/useToast'
import StickerModal from '@/components/StickerModal.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const toast = useToast()

interface Sticker {
  id: number
  name: string
  category: string
  imagePath: string
  width: number
  height: number
  url: string
  createdAt: string
}

const items = ref<Sticker[]>([])
const loading = ref(true)
const modalVisible = ref(false)
const editingSticker = ref<Sticker | undefined>(undefined)
const activeCategory = ref('all')
const confirmVisible = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
let pendingDeleteItem: Sticker | null = null

const categories = computed(() => {
  const cats = new Map<string, number>()
  items.value.forEach(i => {
    cats.set(i.category, (cats.get(i.category) || 0) + 1)
  })
  const result = [{ key: 'all', label: `全部 (${items.value.length})` }]
  cats.forEach((count, cat) => {
    const labels: Record<string, string> = {
      recommend: '推荐',
      geometric: '几何',
      nature: '自然',
      abstract: '抽象',
      general: '通用'
    }
    result.push({ key: cat, label: `${labels[cat] || cat} (${count})` })
  })
  return result
})

const filteredItems = computed(() =>
  activeCategory.value === 'all'
    ? items.value
    : items.value.filter(i => i.category === activeCategory.value)
)

async function fetchItems() {
  loading.value = true
  const res = await api.get<{ items: Sticker[] }>('/stickers')
  if (res.success && res.data) {
    items.value = res.data.items || []
  }
  loading.value = false
}

function openUpload() {
  editingSticker.value = undefined
  modalVisible.value = true
}

function openEdit(sticker: Sticker) {
  editingSticker.value = sticker
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
  editingSticker.value = undefined
}

async function handleSave(data: { name: string; category: string; file?: File }) {
  if (editingSticker.value) {
    if (data.file) {
      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('name', data.name)
      formData.append('category', data.category)
      const res = await api.upload(`/admin/stickers/${editingSticker.value.id}`, formData)
      if (!res.success) { toast.error(res.error || '保存失败'); return }
    } else {
      const res = await api.put(`/admin/stickers/${editingSticker.value.id}`, { name: data.name, category: data.category })
      if (!res.success) { toast.error(res.error || '保存失败'); return }
    }
    toast.success('保存成功')
  } else if (data.file) {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('name', data.name)
    formData.append('category', data.category)
    const res = await api.upload('/admin/stickers', formData)
    if (!res.success) { toast.error(res.error || '上传失败'); return }
    toast.success('上传成功')
  }
  closeModal()
  await fetchItems()
}

function handleDelete(item: Sticker) {
  pendingDeleteItem = item
  confirmTitle.value = '确认删除'
  confirmMessage.value = `确定要删除"${item.name}"吗？`
  confirmVisible.value = true
}

async function doDelete() {
  if (!pendingDeleteItem) return
  const res = await api.delete(`/admin/stickers/${pendingDeleteItem.id}`)
  confirmVisible.value = false
  pendingDeleteItem = null
  if (!res.success) { toast.error(res.error || '删除失败'); return }
  toast.success('删除成功')
  fetchItems()
}

onMounted(fetchItems)
</script>
