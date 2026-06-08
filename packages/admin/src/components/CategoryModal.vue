<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/50" />

        <div class="relative bg-white rounded-lg w-[480px] shadow-lg flex flex-col">
          <div class="flex items-center justify-between px-6 py-5 border-b border-transparent">
            <h2 class="text-base font-semibold text-text-primary">
              {{ category ? '编辑分类' : '新增分类' }}
            </h2>
            <button
              class="rounded p-1 text-text-muted hover:text-text-primary transition-colors"
              @click="$emit('close')"
            >
              <X :size="18" />
            </button>
          </div>

          <div class="px-6 py-6 flex flex-col gap-5">
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-medium text-text-primary">分类名称</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="请输入分类名称"
                class="h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-medium text-text-primary">别名 (Slug)</label>
              <p class="text-xs text-text-muted">用于 URL 路径，仅支持小写字母、数字和连字符</p>
              <input
                v-model="form.slug"
                type="text"
                placeholder="例如: t-shirts"
                class="h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 px-6 py-4">
            <button
              class="rounded px-4 py-2 text-[13px] font-medium text-text-primary border border-border hover:bg-gray-50 transition-colors"
              @click="$emit('close')"
            >
              取消
            </button>
            <button
              class="rounded px-4 py-2 text-[13px] font-medium text-white bg-primary hover:bg-primary/90 transition-colors flex items-center gap-2"
              @click="handleSave"
            >
              <Check :size="16" />
              {{ category ? '确认修改' : '确认添加' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { X, Check } from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  category?: { id: number; name: string; slug: string }
}>()

const emit = defineEmits<{
  close: []
  save: [data: { name: string; slug: string }]
}>()

const form = reactive({ name: '', slug: '' })

watch(
  () => props.visible,
  (val) => {
    if (val) {
      form.name = props.category?.name || ''
      form.slug = props.category?.slug || ''
    }
  }
)

function handleSave() {
  if (!form.name.trim()) return
  emit('save', { name: form.name.trim(), slug: form.slug.trim() })
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
