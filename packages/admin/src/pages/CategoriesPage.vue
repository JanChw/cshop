<template>
  <div class="p-6 flex flex-col gap-4 min-h-screen">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-text-primary">分类管理</h1>
      <button
        class="rounded bg-primary text-white text-sm font-medium h-10 px-4 flex items-center gap-2 hover:bg-primary/90 transition-colors"
        @click="openAdd"
      >
        <Plus :size="16" />
        新增分类
      </button>
    </div>

    <div class="flex-1 bg-card border border-border rounded-md overflow-hidden flex flex-col">
      <div class="flex items-center px-4 bg-table-header h-11 shrink-0">
        <span class="w-[24px]"></span>
        <span class="w-[60px] text-xs font-semibold text-text-primary">ID</span>
        <span class="w-[200px] text-xs font-semibold text-text-primary">分类名称</span>
        <span class="flex-1 text-xs font-semibold text-text-primary">别名 (Slug)</span>
        <span class="w-[100px] text-xs font-semibold text-text-primary">商品数</span>
        <span class="w-[120px] text-xs font-semibold text-text-primary">操作</span>
      </div>

      <div class="flex-1 overflow-auto">
        <div v-if="loading" class="flex items-center justify-center h-40">
          <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <template v-else>
          <div
            v-for="(cat, index) in categories"
            :key="cat.id"
            draggable="true"
            class="flex items-center px-4 h-[52px] border-b border-border cursor-grab select-none"
            :class="[
              dragIndex === index ? 'opacity-50' : '',
              dragOverIndex === index ? 'border-t-2 border-primary' : '',
            ]"
            @dragstart="onDragStart(index)"
            @dragover.prevent="onDragOver(index)"
            @dragenter.prevent="onDragEnter(index)"
            @dragleave="onDragLeave"
            @drop="onDrop(index)"
            @dragend="onDragEnd"
          >
          <span class="w-[24px] text-text-muted opacity-40">
            <GripVertical :size="14" />
          </span>
          <span class="w-[60px] text-sm text-text-muted font-mono">{{ cat.id }}</span>
          <span class="w-[200px] text-sm text-text-primary font-medium">{{ cat.name }}</span>
          <span class="flex-1 text-sm text-text-muted font-mono">{{ cat.slug }}</span>
          <span class="w-[100px] text-sm text-text-primary">{{ cat.productCount }}</span>
          <div class="w-[120px] flex items-center gap-2">
            <button
              class="rounded p-1 text-text-muted hover:bg-gray-100 transition-colors"
              @click.stop="openEdit(cat)"
            >
              <Pencil :size="14" />
            </button>
            <button
              class="rounded p-1 text-danger hover:bg-red-50 transition-colors"
              @click.stop="handleDelete(cat)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
          </div>
        </template>
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
          @click.self="closeDeleteModal"
        >
          <div class="absolute inset-0 bg-black/50" />
          <div class="relative glass rounded-md w-[420px] border border-border p-7 flex flex-col gap-5">
            <h3 class="text-base font-semibold text-text-primary">{{ deleteTitle }}</h3>

            <p v-if="deletingCategory && deletingCategory.productCount === 0" class="text-sm text-text-muted">
              确定要删除分类
              <span class="font-medium text-text-primary">{{ deletingCategory.name }}</span>
              吗？此操作不可撤销。
            </p>

            <template v-else-if="deletingCategory">
              <p class="text-sm text-text-muted">
                分类
                <span class="font-medium text-text-primary">{{ deletingCategory.name }}</span>
                下还有 <strong class="text-text-primary">{{ deletingCategory.productCount }}</strong> 个商品。
                请选择这些商品要移至的分类：
              </p>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-text-muted">目标分类</label>
                <div class="relative">
                  <select
                    v-model.number="reassignTo"
                    class="w-full h-10 rounded border border-border px-3 pr-8 text-sm text-text-primary bg-white outline-none appearance-none cursor-pointer"
                  >
                    <option :value="null" disabled>请选择目标分类</option>
                    <option
                      v-for="cat in reassignCandidates"
                      :key="cat.id"
                      :value="cat.id"
                    >
                      {{ cat.name }}
                    </option>
                  </select>
                  <ChevronDown :size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>
            </template>

            <div class="flex items-center justify-end gap-3">
              <button
                class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
                @click="closeDeleteModal"
              >
                取消
              </button>
              <button
                class="h-10 rounded bg-danger px-4 text-sm font-medium text-white hover:bg-danger/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="deletingCategory && deletingCategory.productCount > 0 && !reassignTo"
                @click="confirmDelete"
              >
                {{ deletingCategory && deletingCategory.productCount > 0 ? '移至目标分类并删除' : '确认删除' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Pencil, Trash2, ChevronDown, GripVertical } from 'lucide-vue-next'
import { api } from '@/utils/api'
import CategoryModal from '@/components/CategoryModal.vue'
import { useToast } from '@/composables/useToast'

const toast = useToast()

interface Category {
  id: number
  name: string
  slug: string
  sort: number
  productCount: number
}

const categories = ref<Category[]>([])
const loading = ref(false)
const modalVisible = ref(false)
const deleteModalVisible = ref(false)
const deletingCategory = ref<Category | undefined>(undefined)
const editingCategory = ref<Category | undefined>(undefined)
const reassignTo = ref<number | null>(null)
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const deleteTitle = computed(() => {
  if (!deletingCategory.value) return '确认删除'
  return deletingCategory.value.productCount > 0 ? '删除分类（需迁移商品）' : '确认删除'
})

const reassignCandidates = computed(() =>
  categories.value.filter((c) => c.id !== deletingCategory.value?.id)
)

async function fetchCategories() {
  loading.value = true
  const res = await api.get<{ items: { id: number; name: string; slug: string; sort: number; productCount: number }[] }>('/categories')
  if (res.success && res.data) {
    categories.value = (res.data.items || []).map((c) => ({ ...c, productCount: c.productCount ?? 0 }))
  }
  loading.value = false
}

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

async function handleSave(data: { name: string; slug: string }) {
  if (editingCategory.value) {
    const res = await api.put<{ id: number; name: string; slug: string }>(
      `/admin/categories/${editingCategory.value.id}`,
      data
    )
    if (!res.success) return
  } else {
    const res = await api.post<{ id: number; name: string; slug: string }>('/admin/categories', data)
    if (!res.success) return
  }
  closeModal()
  await fetchCategories()
}

function handleDelete(cat: Category) {
  deletingCategory.value = cat
  reassignTo.value = null
  deleteModalVisible.value = true
}

function closeDeleteModal() {
  deleteModalVisible.value = false
  deletingCategory.value = undefined
  reassignTo.value = null
}

async function confirmDelete() {
  if (!deletingCategory.value) return
  const id = deletingCategory.value.id
  const needsReassign = deletingCategory.value.productCount > 0

  const res = await api.delete<{ reassigned: number }>(
    `/admin/categories/${id}`,
    needsReassign && reassignTo.value !== null ? { reassignTo: reassignTo.value } : undefined
  )

  if (!res.success) {
    toast.error(res.error || '删除失败')
    return
  }

  if (needsReassign && res.data) {
    toast.success(`已迁移 ${res.data.reassigned} 个商品并删除分类`)
  } else {
    toast.success('删除成功')
  }
  closeDeleteModal()
  await fetchCategories()
}

function onDragStart(index: number) {
  dragIndex.value = index
}

function onDragOver(index: number) {
  dragOverIndex.value = index
}

function onDragEnter(index: number) {
  dragOverIndex.value = index
}

function onDragLeave() {
  dragOverIndex.value = null
}

async function onDrop(index: number) {
  if (dragIndex.value === null || dragIndex.value === index) {
    onDragEnd()
    return
  }
  const from = dragIndex.value
  const item = categories.value.splice(from, 1)[0]
  categories.value.splice(index, 0, item)
  onDragEnd()
  await persistOrder()
}

function onDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
}

async function persistOrder() {
  const payload = categories.value.map((cat, index) => ({ id: cat.id, sort: index }))
  const res = await api.put('/admin/categories/reorder', payload)
  if (!res.success) {
    toast.error(res.error || '保存顺序失败')
    await fetchCategories()
  }
}

onMounted(fetchCategories)
</script>

<style scoped>
.modal-enter-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.modal-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.modal-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}
.modal-leave-to {
  opacity: 0;
  transform: scale(0.98) translateY(-4px);
}
</style>
