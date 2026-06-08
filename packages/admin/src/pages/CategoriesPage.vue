<template>
  <div class="p-6 flex flex-col gap-4 min-h-screen">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-text-primary">分类管理</h1>
      <button
        class="rounded bg-primary text-white text-sm font-medium px-4 py-2.5 flex items-center gap-2 hover:bg-primary/90 transition-colors"
        @click="openAdd"
      >
        <Plus :size="16" />
        新增分类
      </button>
    </div>

    <div class="flex-1 bg-card border border-border rounded-md overflow-hidden flex flex-col">
      <div class="flex items-center px-4 bg-table-header h-11 shrink-0">
        <span class="w-[60px] text-xs font-semibold text-text-muted">ID</span>
        <span class="w-[200px] text-xs font-semibold text-text-muted">分类名称</span>
        <span class="flex-1 text-xs font-semibold text-text-muted">别名 (Slug)</span>
        <span class="w-[100px] text-xs font-semibold text-text-muted">商品数</span>
        <span class="w-[120px] text-xs font-semibold text-text-muted">操作</span>
      </div>

      <div class="flex-1 overflow-auto">
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="flex items-center px-4 h-[52px] border-b border-border"
        >
          <span class="w-[60px] text-sm text-text-muted font-mono">{{ cat.id }}</span>
          <span class="w-[200px] text-sm text-text-primary font-medium">{{ cat.name }}</span>
          <span class="flex-1 text-sm text-text-muted font-mono">{{ cat.slug }}</span>
          <span class="w-[100px] text-sm text-text-primary">{{ cat.count }}</span>
          <div class="w-[120px] flex items-center gap-2">
            <button
              class="rounded p-1 text-text-muted hover:bg-gray-100 transition-colors"
              @click="openEdit(cat)"
            >
              <Pencil :size="14" />
            </button>
            <button
              class="rounded p-1 text-danger hover:bg-red-50 transition-colors"
              @click="handleDelete(cat)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <CategoryModal
      :visible="modalVisible"
      :category="editingCategory"
      @close="closeModal"
      @save="handleSave"
    />

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="deleteModalVisible"
          class="fixed inset-0 z-50 flex items-center justify-center"
          @click.self="deleteModalVisible = false"
        >
          <div class="absolute inset-0 bg-black/50" />
          <div class="relative bg-white rounded-md w-[400px] border border-border p-7 flex flex-col gap-5">
            <h3 class="text-base font-semibold text-text-primary">确认删除</h3>
            <p class="text-sm text-text-muted">
              确定要删除分类
              <span v-if="deletingCategory" class="font-medium text-text-primary">
                {{ deletingCategory.name }}
              </span>
              吗？此操作不可撤销。
            </p>
            <div class="flex items-center justify-end gap-3">
              <button
                class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
                @click="deleteModalVisible = false"
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
import { ref } from 'vue'
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'
import CategoryModal from '@/components/CategoryModal.vue'

interface Category {
  id: number
  name: string
  slug: string
  count: number
}

const categories = ref<Category[]>([
  { id: 1, name: 'T恤', slug: 't-shirts', count: 12 },
  { id: 2, name: '裤子', slug: 'pants', count: 8 },
  { id: 3, name: '外套', slug: 'jackets', count: 5 },
  { id: 4, name: '连衣裙', slug: 'dresses', count: 3 },
  { id: 5, name: '配饰', slug: 'accessories', count: 7 },
  { id: 6, name: '鞋类', slug: 'shoes', count: 4 },
])

const modalVisible = ref(false)
const deleteModalVisible = ref(false)
const deletingCategory = ref<Category | undefined>(undefined)
const editingCategory = ref<Category | undefined>(undefined)

function openAdd() {
  editingCategory.value = undefined
  modalVisible.value = true
}

function openEdit(cat: Category) {
  editingCategory.value = cat
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
  editingCategory.value = undefined
}

function handleSave(data: { name: string; slug: string }) {
  if (editingCategory.value) {
    const cat = categories.value.find((c) => c.id === editingCategory.value!.id)
    if (cat) {
      cat.name = data.name
      cat.slug = data.slug
    }
  } else {
    const maxId = Math.max(...categories.value.map((c) => c.id))
    categories.value.push({ id: maxId + 1, name: data.name, slug: data.slug, count: 0 })
  }
  closeModal()
}

function handleDelete(cat: Category) {
  deletingCategory.value = cat
  deleteModalVisible.value = true
}

function confirmDelete() {
  if (deletingCategory.value) {
    categories.value = categories.value.filter((c) => c.id !== deletingCategory.value!.id)
  }
  deleteModalVisible.value = false
  deletingCategory.value = undefined
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
