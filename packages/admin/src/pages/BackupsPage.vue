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
        <span class="w-[60px] text-xs font-semibold text-text-muted">ID</span>
        <span class="flex-1 text-xs font-semibold text-text-muted">文件名</span>
        <span class="w-[120px] text-xs font-semibold text-text-muted">文件大小</span>
        <span class="w-[160px] text-xs font-semibold text-text-muted">创建时间</span>
        <span class="w-[160px] text-xs font-semibold text-text-muted">操作</span>
      </div>

      <div class="flex-1 overflow-auto">
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
        <div v-if="backups.length === 0" class="flex items-center justify-center h-20 text-sm text-text-muted">
          暂无备份记录
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="tooltip.visible"
        class="fixed px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap pointer-events-none z-[9999]"
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
import { ref, reactive } from 'vue'
import { Database, Info, Download, RotateCcw, Trash2 } from 'lucide-vue-next'

interface Backup {
  id: number
  filename: string
  size: string
  createdAt: string
}

const backups = ref<Backup[]>([
  { id: 1, filename: 'backup_20240115_120000.db', size: '2.4 MB', createdAt: '2024-01-15 12:00:00' },
  { id: 2, filename: 'backup_20240120_090000.db', size: '2.6 MB', createdAt: '2024-01-20 09:00:00' },
  { id: 3, filename: 'backup_20240201_180000.db', size: '2.8 MB', createdAt: '2024-02-01 18:00:00' },
  { id: 4, filename: 'backup_20240215_100000.db', size: '3.1 MB', createdAt: '2024-02-15 10:00:00' },
  { id: 5, filename: 'backup_20240301_140000.db', size: '3.3 MB', createdAt: '2024-03-01 14:00:00' },
])

const restoreModalVisible = ref(false)
const deleteModalVisible = ref(false)
const selectedBackup = ref<Backup | null>(null)

const tooltip = reactive({ visible: false, text: '', x: 0, y: 0 })

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

function createBackup() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const maxId = Math.max(...backups.value.map((b) => b.id))
  const size = (Math.random() * 2 + 2).toFixed(1)
  backups.value.unshift({
    id: maxId + 1,
    filename: `backup_${date}_${time}.db`,
    size: `${size} MB`,
    createdAt: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
  })
}

function downloadBackup(backup: Backup) {
  const blob = new Blob([`模拟备份文件内容: ${backup.filename}`], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = backup.filename
  a.click()
  URL.revokeObjectURL(url)
}

function openRestoreModal(backup: Backup) {
  selectedBackup.value = backup
  restoreModalVisible.value = true
}

function confirmRestore() {
  restoreModalVisible.value = false
  selectedBackup.value = null
}

function openDeleteModal(backup: Backup) {
  selectedBackup.value = backup
  deleteModalVisible.value = true
}

function confirmDelete() {
  if (selectedBackup.value) {
    backups.value = backups.value.filter((b) => b.id !== selectedBackup.value!.id)
  }
  deleteModalVisible.value = false
  selectedBackup.value = null
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
