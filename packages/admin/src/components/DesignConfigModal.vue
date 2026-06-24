<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/50" />

        <div class="relative glass rounded-md w-[480px] border border-border flex flex-col">
          <div class="flex items-center justify-between px-6 py-5 border-b border-border">
            <h2 class="text-base font-semibold text-text-primary">
              {{ config ? '编辑配置项' : '新增配置项' }}
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
              <label class="text-sm font-medium text-text-primary">名称</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="显示名称"
                class="h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">
                值
                <span class="text-xs text-text-muted ml-2">颜色值 / font-family / 标识符</span>
              </label>
              <div class="flex gap-2 items-center">
                <input
                  v-model="form.value"
                  type="text"
                  placeholder="例如: #ffffff"
                  class="flex-1 h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors font-mono"
                />
                <input
                  v-if="showColorPicker"
                  v-model="form.value"
                  type="color"
                  class="w-9 h-9 rounded border border-border cursor-pointer p-0.5"
                />
              </div>
            </div>

            <div v-if="group === 'font'" class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">副标签</label>
              <input
                v-model="form.subLabel"
                type="text"
                placeholder="例如: Modern Sans"
                class="h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
              />
            </div>

            <div v-if="group === 'brush_style'" class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">显示标签</label>
              <input
                v-model="form.brushLabel"
                type="text"
                placeholder="例如: 铅笔"
                class="h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
              />
              <label class="text-sm font-medium text-text-primary mt-3">图标名</label>
              <input
                v-model="form.brushIcon"
                type="text"
                placeholder="material-icons 名称"
                class="h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
            <button
              class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
              @click="$emit('close')"
            >
              取消
            </button>
            <button
              class="h-10 rounded bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors flex items-center gap-2"
              @click="handleSave"
            >
              <Check :size="16" />
              {{ config ? '确认修改' : '确认添加' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import { X, Check } from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  group: string
  config?: { id: number; name: string; value: string; extra: any }
}>()

const emit = defineEmits<{
  close: []
  save: [data: { name: string; value: string; extra?: string | null }]
}>()

const form = reactive({ name: '', value: '', subLabel: '', brushLabel: '', brushIcon: '' })

const showColorPicker = computed(() =>
  ['tshirt_color', 'text_palette', 'brush_color'].includes(props.group)
)

watch(
  () => props.visible,
  (val) => {
    if (val) {
      form.name = props.config?.name || ''
      form.value = props.config?.value || ''
      if (props.group === 'font' && props.config?.extra) {
        form.subLabel = props.config.extra.sub || ''
      } else {
        form.subLabel = ''
      }
      if (props.group === 'brush_style' && props.config?.extra) {
        form.brushLabel = props.config.extra.label || ''
        form.brushIcon = props.config.extra.icon || ''
      } else {
        form.brushLabel = ''
        form.brushIcon = ''
      }
    }
  }
)

function handleSave() {
  if (!form.name.trim() || !form.value.trim()) return

  let extra: string | null = null
  if (props.group === 'font' && form.subLabel) {
    extra = JSON.stringify({ sub: form.subLabel })
  }
  if (props.group === 'brush_style') {
    extra = JSON.stringify({ label: form.brushLabel || form.name, icon: form.brushIcon || 'edit' })
  }

  emit('save', { name: form.name.trim(), value: form.value.trim(), extra })
}
</script>

<style scoped>
.modal-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.modal-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.modal-enter-from { opacity: 0; transform: scale(0.95) translateY(8px); }
.modal-leave-to { opacity: 0; transform: scale(0.98) translateY(-4px); }
</style>
