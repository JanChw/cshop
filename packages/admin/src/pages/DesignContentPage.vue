<template>
  <div class="p-6 flex flex-col gap-4 min-h-screen">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-text-primary">设计页内容管理</h1>
    </div>

    <div class="flex gap-2 flex-wrap border-b border-border pb-3">
      <button
        v-for="tab in groupTabs"
        :key="tab.key"
        class="rounded h-9 px-4 text-sm font-medium transition-colors"
        :class="activeGroup === tab.key ? 'bg-primary text-white' : 'bg-surface text-text-primary hover:bg-gray-100'"
        @click="activeGroup = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="flex items-center justify-between">
      <p class="text-sm text-text-muted">{{ currentTab?.description }}</p>
      <button
        class="rounded bg-primary text-white text-sm font-medium h-9 px-3 flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
        @click="openAdd"
      >
        <Plus :size="14" />
        新增
      </button>
    </div>

    <div class="bg-card border border-border rounded-md overflow-hidden flex flex-col">
      <div class="flex items-center px-4 bg-table-header h-11 shrink-0">
        <span class="w-[60px] text-xs font-semibold text-text-primary">ID</span>
        <span class="w-[200px] text-xs font-semibold text-text-primary">名称</span>
        <span class="w-[180px] text-xs font-semibold text-text-primary">值</span>
        <span class="flex-1 text-xs font-semibold text-text-primary">附加属性</span>
        <span class="w-[80px] text-xs font-semibold text-text-primary">状态</span>
        <span class="w-[100px] text-xs font-semibold text-text-primary">操作</span>
      </div>

      <div class="flex-1 overflow-auto">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="flex items-center px-4 h-[52px] border-b border-border"
        >
          <span class="w-[60px] text-sm text-text-muted font-mono">{{ item.id }}</span>
          <span class="w-[200px] text-sm text-text-primary font-medium">{{ item.name }}</span>
          <span class="w-[180px] text-sm text-text-muted font-mono">
            <span
              v-if="item.configGroup === 'tshirt_color' || item.configGroup === 'text_palette' || item.configGroup === 'brush_color'"
              class="inline-block w-4 h-4 rounded-full align-middle mr-1.5 border border-border"
              :style="{ backgroundColor: item.value }"
            ></span>
            {{ item.value }}
          </span>
          <span class="flex-1 text-sm text-text-muted font-mono text-xs">{{ item.extra ? JSON.stringify(item.extra) : '-' }}</span>
          <span class="w-[80px]">
            <StatusBadge :label="item.isActive ? '启用' : '禁用'" :variant="item.isActive ? 'success' : 'inactive'" />
          </span>
          <div class="w-[100px] flex items-center gap-2">
            <button
              class="rounded p-1 text-text-muted hover:bg-gray-100 transition-colors"
              @click="toggleActive(item)"
            >
              <component :is="item.isActive ? EyeOff : Eye" :size="14" />
            </button>
            <button
              class="rounded p-1 text-text-muted hover:bg-gray-100 transition-colors"
              @click="openEdit(item)"
            >
              <Pencil :size="14" />
            </button>
            <button
              class="rounded p-1 text-danger hover:bg-red-50 transition-colors"
              @click="handleDelete(item)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
        <div v-if="filteredItems.length === 0" class="flex items-center justify-center h-24 text-sm text-text-muted">
          暂无配置项
        </div>
      </div>
    </div>

    <DesignConfigModal
      :visible="modalVisible"
      :config="editingConfig"
      :group="activeGroup"
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
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-vue-next'
import { api } from '@/utils/api'
import { useToast } from '@/composables/useToast'
import DesignConfigModal from '@/components/DesignConfigModal.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const toast = useToast()

interface DesignConfig {
  id: number
  configGroup: string
  name: string
  value: string
  extra: string | null
  sort: number
  isActive: boolean
  createdAt: string
}

const groupTabs = [
  { key: 'tshirt_color', label: 'T恤颜色', description: '管理 T恤预设颜色选项' },
  { key: 'text_palette', label: '文字调色板', description: '管理文字颜色预设' },
  { key: 'font', label: '字体选项', description: '管理文字引擎可用字体' },
  { key: 'brush_color', label: '画笔颜色', description: '管理手绘画笔颜色预设' },
  { key: 'brush_style', label: '画笔样式', description: '管理手绘画笔样式' },
]

const activeGroup = ref('tshirt_color')
const items = ref<DesignConfig[]>([])
const modalVisible = ref(false)
const editingConfig = ref<DesignConfig | undefined>(undefined)
const confirmVisible = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
let pendingDeleteItem: DesignConfig | null = null

const currentTab = computed(() => groupTabs.find(t => t.key === activeGroup.value))
const filteredItems = computed(() => items.value.filter(i => i.configGroup === activeGroup.value))

async function fetchItems() {
  const res = await api.get<{ items: DesignConfig[] }>('/admin/design-configs')
  if (res.success && res.data) {
    items.value = (res.data.items || []).map(i => ({
      ...i,
      extra: typeof i.extra === 'string' ? (() => { try { return JSON.parse(i.extra) } catch { return i.extra } })() : i.extra
    }))
  }
}

async function toggleActive(item: DesignConfig) {
  const res = await api.put(`/admin/design-configs/${item.id}`, { isActive: !item.isActive })
  if (res.success) {
    item.isActive = !item.isActive
    toast.success(item.isActive ? '已启用' : '已禁用')
  }
}

function openAdd() {
  editingConfig.value = undefined
  modalVisible.value = true
}

function openEdit(config: DesignConfig) {
  editingConfig.value = config
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
  editingConfig.value = undefined
}

async function handleSave(data: { name: string; value: string; extra?: string | null; isActive?: boolean }) {
  if (editingConfig.value) {
    const res = await api.put(`/admin/design-configs/${editingConfig.value.id}`, data)
    if (!res.success) { toast.error(res.error || '保存失败'); return }
    toast.success('保存成功')
  } else {
    const res = await api.post('/admin/design-configs', { ...data, group: activeGroup.value })
    if (!res.success) { toast.error(res.error || '创建失败'); return }
    toast.success('创建成功')
  }
  closeModal()
  await fetchItems()
}

function handleDelete(item: DesignConfig) {
  pendingDeleteItem = item
  confirmTitle.value = '确认删除'
  confirmMessage.value = `确定要删除"${item.name}"吗？`
  confirmVisible.value = true
}

async function doDelete() {
  if (!pendingDeleteItem) return
  const res = await api.delete(`/admin/design-configs/${pendingDeleteItem.id}`)
  confirmVisible.value = false
  pendingDeleteItem = null
  if (!res.success) { toast.error(res.error || '删除失败'); return }
  toast.success('删除成功')
  fetchItems()
}

watch(activeGroup, () => { editingConfig.value = undefined })

onMounted(fetchItems)
</script>

<style scoped>
.modal-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.modal-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.modal-enter-from { opacity: 0; transform: scale(0.95) translateY(8px); }
.modal-leave-to { opacity: 0; transform: scale(0.98) translateY(-4px); }
</style>
