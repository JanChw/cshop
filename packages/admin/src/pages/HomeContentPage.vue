<template>
  <div class="p-6 flex flex-col gap-4 min-h-screen">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-text-primary">首页内容管理</h1>
      <button
        class="rounded bg-primary text-white text-sm font-medium h-10 px-4 flex items-center gap-2 hover:bg-primary/90 transition-colors"
        @click="openAdd"
      >
        <Plus :size="16" />
        新增区块
      </button>
    </div>

    <div class="flex-1 bg-card border border-border rounded-md overflow-hidden flex flex-col">
      <div class="flex items-center px-4 bg-table-header h-11 shrink-0">
        <span class="w-[24px]"></span>
        <span class="w-[60px] text-xs font-semibold text-text-muted">ID</span>
        <span class="w-[90px] text-xs font-semibold text-text-muted">区块类型</span>
        <span class="w-[120px] text-xs font-semibold text-text-muted">标题</span>
        <span class="w-[140px] text-xs font-semibold text-text-muted">副标题</span>
        <span class="flex-1 text-xs font-semibold text-text-muted">数据预览</span>
        <span class="w-[70px] text-xs font-semibold text-text-muted">状态</span>
        <span class="w-[110px] text-xs font-semibold text-text-muted">操作</span>
      </div>

      <div class="flex-1 overflow-auto">
        <div
          v-for="(sec, index) in sections"
          :key="sec.id"
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
          <span class="w-[60px] text-sm text-text-muted font-mono">{{ sec.id }}</span>
          <span class="w-[90px] text-sm text-text-primary">
            <span
              class="inline-block rounded px-2 py-0.5 text-xs font-medium"
              :class="badgeClass(sec.type)"
            >{{ typeLabel(sec.type) }}</span>
          </span>
          <span class="w-[120px] text-sm text-text-primary truncate">{{ sec.title || '-' }}</span>
          <span class="w-[140px] text-sm text-text-muted truncate">{{ sec.subTitle || '-' }}</span>
          <span class="flex-1 text-sm text-text-muted truncate font-mono text-xs">{{ dataPreview(sec.data) }}</span>
          <span class="w-[70px] text-sm">
            <span
              class="inline-block rounded px-2 py-0.5 text-xs font-medium"
              :class="sec.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
            >{{ sec.isActive ? '启用' : '禁用' }}</span>
          </span>
          <div class="w-[110px] flex items-center gap-1">
            <button
              class="rounded p-1 text-text-muted hover:bg-gray-100 transition-colors"
              @click.stop="toggleActive(sec)"
              :title="sec.isActive ? '禁用' : '启用'"
            >
              <component :is="sec.isActive ? EyeOff : Eye" :size="14" />
            </button>
            <button
              class="rounded p-1 text-text-muted hover:bg-gray-100 transition-colors"
              @click.stop="openEdit(sec)"
            >
              <Pencil :size="14" />
            </button>
            <button
              class="rounded p-1 text-danger hover:bg-red-50 transition-colors"
              @click.stop="handleDelete(sec)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <SectionModal
      :visible="modalVisible"
      :section="editingSection"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff } from 'lucide-vue-next'
import { api } from '@/utils/api'
import { useToast } from '@/composables/useToast'
import SectionModal from '@/components/SectionModal.vue'

const toast = useToast()

interface Section {
  id: number
  type: string
  title: string | null
  subTitle: string | null
  data: string
  sort: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const sections = ref<Section[]>([])
const modalVisible = ref(false)
const editingSection = ref<Section | undefined>(undefined)
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const TYPE_LABELS: Record<string, string> = {
  hero: '主横幅',
  videos: '教学视频',
  product_row: '商品行',
  card_grid: '卡片网格',
  designer_grid: '联名设计师'
}

const TYPE_BADGES: Record<string, string> = {
  hero: 'bg-purple-100 text-purple-700',
  videos: 'bg-blue-100 text-blue-700',
  product_row: 'bg-amber-100 text-amber-700',
  card_grid: 'bg-teal-100 text-teal-700',
  designer_grid: 'bg-rose-100 text-rose-700'
}

function typeLabel(type: string) {
  return TYPE_LABELS[type] || type
}

function badgeClass(type: string) {
  return TYPE_BADGES[type] || 'bg-gray-100 text-gray-600'
}

function dataPreview(data: unknown) {
  if (typeof data !== 'string') {
    return JSON.stringify(data).slice(0, 60)
  }
  try {
    const obj = JSON.parse(data)
    const str = JSON.stringify(obj)
    return str.length > 60 ? str.slice(0, 60) + '...' : str
  } catch {
    return data.slice(0, 60)
  }
}

async function fetchSections() {
  const res = await api.get<{ items: Section[] }>('/admin/home-sections')
  if (res.success && res.data) {
    sections.value = res.data.items || []
  }
}

async function toggleActive(sec: Section) {
  const res = await api.put(`/admin/home-sections/${sec.id}`, { isActive: !sec.isActive })
  if (res.success) {
    sec.isActive = !sec.isActive
    toast.success(sec.isActive ? '已启用' : '已禁用')
  }
}

function openAdd() {
  editingSection.value = undefined
  modalVisible.value = true
}

function openEdit(sec: Section) {
  editingSection.value = sec
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
  editingSection.value = undefined
}

async function handleSave(data: { type: string; title: string; subTitle: string; data: string }) {
  if (editingSection.value) {
    const res = await api.put(`/admin/home-sections/${editingSection.value.id}`, data)
    if (!res.success) { toast.error(res.error || '保存失败'); return }
    toast.success('保存成功')
  } else {
    const res = await api.post('/admin/home-sections', data)
    if (!res.success) { toast.error(res.error || '创建失败'); return }
    toast.success('创建成功')
  }
  closeModal()
  await fetchSections()
}

function handleDelete(sec: Section) {
  if (!confirm(`确定要删除"${sec.title || typeLabel(sec.type)}"吗？`)) return
  api.delete(`/admin/home-sections/${sec.id}`).then(res => {
    if (!res.success) { toast.error(res.error || '删除失败'); return }
    toast.success('删除成功')
    fetchSections()
  })
}

function onDragStart(index: number) { dragIndex.value = index }
function onDragOver(index: number) { dragOverIndex.value = index }
function onDragEnter(index: number) { dragOverIndex.value = index }
function onDragLeave() { dragOverIndex.value = null }
function onDragEnd() { dragIndex.value = null; dragOverIndex.value = null }

async function onDrop(index: number) {
  if (dragIndex.value === null || dragIndex.value === index) { onDragEnd(); return }
  const from = dragIndex.value
  const item = sections.value.splice(from, 1)[0]
  sections.value.splice(index, 0, item)
  onDragEnd()
  await persistOrder()
}

async function persistOrder() {
  const payload = sections.value.map((sec, i) => ({ id: sec.id, sort: i }))
  const res = await api.put('/admin/home-sections/reorder', payload)
  if (!res.success) {
    toast.error(res.error || '保存顺序失败')
    await fetchSections()
  } else {
    toast.success('排序已保存')
  }
}

onMounted(fetchSections)
</script>

<style scoped>
.modal-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.modal-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.modal-enter-from { opacity: 0; transform: scale(0.95) translateY(8px); }
.modal-leave-to { opacity: 0; transform: scale(0.98) translateY(-4px); }
</style>
