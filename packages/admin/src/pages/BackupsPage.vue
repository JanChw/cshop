<template>
  <div class="p-6 flex flex-col gap-4 min-h-screen">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-text-primary">数据备份</h1>
      <button
        class="rounded bg-primary text-white text-sm font-medium h-10 px-4 flex items-center gap-2 hover:bg-primary/90 transition-colors"
        @click="createBackup"
      >
        <Database :size="16" />
        立即备份
      </button>
    </div>

    <div class="flex items-center gap-6 rounded-md bg-info-light px-5 py-4">
      <Info :size="20" class="text-primary shrink-0" />
      <span class="text-sm text-text-primary">数据库备份存储在本地服务器。建议定期备份并下载到本地保存。</span>
    </div>

    <div class="flex-1 bg-card border border-border rounded-md flex flex-col">
      <div class="flex items-center px-4 bg-table-header h-11 shrink-0">
        <span class="w-[60px] text-xs font-semibold text-text-primary">ID</span>
        <span class="flex-1 text-xs font-semibold text-text-primary">文件名</span>
        <span class="w-[120px] text-xs font-semibold text-text-primary">文件大小</span>
        <span class="w-[160px] text-xs font-semibold text-text-primary">创建时间</span>
        <span class="w-[160px] text-xs font-semibold text-text-primary">操作</span>
      </div>

      <div class="flex-1 overflow-auto">
        <div v-if="loading" class="flex items-center justify-center h-40">
          <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <template v-else>
          <div
            v-for="backup in backups"
            :key="backup.id"
            class="flex items-center px-4 h-[52px] border-b border-border"
          >
          <span class="w-[60px] text-sm text-text-muted font-mono">{{ backup.id }}</span>
          <span class="flex-1 text-sm text-text-primary font-mono">{{ backup.filename }}</span>
          <span class="w-[120px] text-sm text-text-muted">{{ backup.size }}</span>
          <span class="w-[160px] text-xs text-text-muted font-mono">{{ backup.createdAt }}</span>
          <div class="w-[160px] flex items-center gap-2">
            <div
              class="relative"
              @mouseenter="(e) => showTooltip(e, '下载')"
              @mouseleave="hideTooltip"
            >
              <button
                class="rounded p-1.5 border border-border text-text-muted hover:bg-gray-50 transition-colors"
                @click="downloadBackup(backup)"
              >
                <Download :size="14" />
              </button>
            </div>
            <div
              class="relative"
              @mouseenter="(e) => showTooltip(e, '恢复')"
              @mouseleave="hideTooltip"
            >
              <button
                class="rounded p-1.5 border border-primary text-primary hover:bg-primary/5 transition-colors"
                @click="openRestoreModal(backup)"
              >
                <RotateCcw :size="14" />
              </button>
            </div>
            <div
              class="relative"
              @mouseenter="(e) => showTooltip(e, '删除')"
              @mouseleave="hideTooltip"
            >
              <button
                class="rounded p-1.5 text-danger hover:bg-red-50 transition-colors"
                @click="openDeleteModal(backup)"
              >
                <Trash2 :size="14" />
              </button>
            </div>
          </div>
          </div>
        </template>
        <div v-if="backups.length === 0 && !loading" class="flex items-center justify-center h-20 text-sm text-text-muted">
          暂无备份记录
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="tooltip.visible"
        class="fixed px-2 py-1 text-xs text-white bg-tooltip-bg rounded whitespace-nowrap pointer-events-none z-[9999]"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px', transform: 'translateX(-50%)' }"
      >
        {{ tooltip.text }}
      </div>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="restoreModalVisible"
          class="fixed inset-0 z-50 flex items-center justify-center"
          @click.self="restoreModalVisible = false"
        >
          <div class="absolute inset-0 bg-black/50" />
          <div class="relative glass rounded-md w-[400px] border border-border p-7 flex flex-col gap-5">
            <h3 class="text-base font-semibold text-text-primary">确认恢复</h3>
            <p class="text-sm text-text-muted">
              确定要恢复备份
              <span v-if="selectedBackup" class="font-medium text-text-primary">
                {{ selectedBackup.filename }}
              </span>
              吗？当前数据将被覆盖。
            </p>
            <div class="flex items-center justify-end gap-3">
              <button
                class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
                @click="restoreModalVisible = false"
              >
                取消
              </button>
              <button
                class="h-10 rounded bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
                @click="confirmRestore"
              >
                确认恢复
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="modal">
        <div
          v-if="deleteModalVisible"
          class="fixed inset-0 z-50 flex items-center justify-center"
          @click.self="deleteModalVisible = false"
        >
          <div class="absolute inset-0 bg-black/50" />
          <div class="relative glass rounded-md w-[400px] border border-border p-7 flex flex-col gap-5">
            <h3 class="text-base font-semibold text-text-primary">确认删除</h3>
            <p class="text-sm text-text-muted">
              确定要删除备份
              <span v-if="selectedBackup" class="font-medium text-text-primary">
                {{ selectedBackup.filename }}
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
import { ref, reactive, onMounted } from 'vue'
import { Database, Info, Download, RotateCcw, Trash2 } from 'lucide-vue-next'
import { api } from '@/utils/api'

interface BackupItem {
  id: number
  filename: string
  size: number
  createdAt: string
}

interface BackupDisplay {
  id: number
  filename: string
  size: string
  createdAt: string
}

const rawBackups = ref<BackupItem[]>([])
const backups = ref<BackupDisplay[]>([])
const loading = ref(false)

const restoreModalVisible = ref(false)
const deleteModalVisible = ref(false)
const selectedBackup = ref<BackupDisplay | null>(null)

const tooltip = reactive({ visible: false, text: '', x: 0, y: 0 })

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)
  return `${size} ${units[i]}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function mapBackups(items: BackupItem[]): BackupDisplay[] {
  return items.map(item => ({
    id: item.id,
    filename: item.filename,
    size: formatSize(item.size),
    createdAt: formatDate(item.createdAt),
  }))
}

async function fetchBackups() {
  loading.value = true
  const res = await api.get<{ items: BackupItem[] }>('/admin/backup')
  if (res.success && res.data) {
    rawBackups.value = res.data.items
    backups.value = mapBackups(res.data.items)
  }
  loading.value = false
}

onMounted(fetchBackups)

function showTooltip(e: MouseEvent, text: string) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  tooltip.visible = true
  tooltip.text = text
  tooltip.x = rect.left + rect.width / 2
  tooltip.y = rect.top - 32
}

function hideTooltip() {
  tooltip.visible = false
}

async function createBackup() {
  await api.post('/admin/backup')
  await fetchBackups()
}

function downloadBackup(backup: BackupDisplay) {
  window.open(`/api/v1/admin/backup/${backup.id}/download`, '_blank')
}

function openRestoreModal(backup: BackupDisplay) {
  selectedBackup.value = backup
  restoreModalVisible.value = true
}

async function confirmRestore() {
  if (selectedBackup.value) {
    await api.post(`/admin/backup/${selectedBackup.value.id}/restore?confirm=yes`)
    restoreModalVisible.value = false
    selectedBackup.value = null
    await fetchBackups()
  }
}

function openDeleteModal(backup: BackupDisplay) {
  selectedBackup.value = backup
  deleteModalVisible.value = true
}

async function confirmDelete() {
  if (selectedBackup.value) {
    await api.delete(`/admin/backup/${selectedBackup.value.id}`)
    deleteModalVisible.value = false
    selectedBackup.value = null
    await fetchBackups()
  }
}
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
