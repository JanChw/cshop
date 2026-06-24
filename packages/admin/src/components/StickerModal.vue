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
              {{ sticker ? '编辑贴纸' : '上传贴纸' }}
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
                placeholder="贴纸名称"
                class="h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">分类</label>
              <select
                v-model="form.category"
                class="h-9 rounded border border-border px-3 text-sm text-text-primary outline-none focus:border-primary transition-colors bg-white"
              >
                <option value="recommend">推荐</option>
                <option value="geometric">几何</option>
                <option value="nature">自然</option>
                <option value="abstract">抽象</option>
                <option value="general">通用</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">文件</label>
              <div
                class="rounded border-2 border-dashed p-6 text-center cursor-pointer transition-colors relative group"
                :class="dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'"
                @click="fileInput?.click()"
                @dragover.prevent="onDragOver"
                @dragenter.prevent="onDragEnter"
                @dragleave.prevent="onDragLeave"
                @drop.prevent="onDrop"
              >
                <template v-if="sticker && !form.file">
                  <div class="w-32 h-32 mx-auto flex items-center justify-center">
                    <img
                      :src="sticker.url"
                      :alt="sticker.name"
                      class="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                    <span class="text-white text-sm font-medium flex items-center gap-1">
                      <Upload :size="16" /> 更换图片
                    </span>
                  </div>
                </template>
                <div v-else-if="!form.file" class="flex flex-col items-center gap-2">
                  <Upload :size="28" class="text-text-muted" />
                  <p class="text-sm text-text-muted">点击或拖放文件到此处</p>
                  <p class="text-xs text-text-muted">支持 PNG、WebP 格式</p>
                </div>
                <div v-else class="flex flex-col items-center gap-2">
                  <CheckCircle :size="28" class="text-green-500" />
                  <p class="text-sm text-text-primary font-medium">{{ form.file.name }}</p>
                  <p class="text-xs text-text-muted">点击或拖放更换文件</p>
                </div>
              </div>
              <input
                ref="fileInput"
                type="file"
                accept="image/png,image/webp"
                class="hidden"
                @change="onFileChange"
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
              :disabled="!canSave"
              @click="handleSave"
            >
              <Check :size="16" />
              {{ sticker ? '确认修改' : '确认上传' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, computed, ref, watch } from 'vue'
import { X, Check, Upload, CheckCircle } from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  sticker?: { id: number; name: string; category: string; url: string }
}>()

const emit = defineEmits<{
  close: []
  save: [data: { name: string; category: string; file?: File }]
}>()

const form = reactive({ name: '', category: 'recommend', file: null as File | null })
const fileInput = ref<HTMLInputElement>()
const dragOver = ref(false)

const canSave = computed(() => {
  if (!form.name.trim()) return false
  if (props.sticker) return true
  return !!form.file
})

watch(
  () => props.visible,
  (val) => {
    if (val) {
      form.name = props.sticker?.name || ''
      form.category = props.sticker?.category || 'recommend'
      form.file = null
      dragOver.value = false
    }
  }
)

function onFileChange(e: Event) {
  const target = e.currentTarget as HTMLInputElement
  const file = target.files?.[0]
  if (file) form.file = file
}

function onDragEnter() {
  dragOver.value = true
}

function onDragOver() {
  dragOver.value = true
}

function onDragLeave() {
  dragOver.value = false
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    const allowed = ['image/png', 'image/webp']
    if (!allowed.includes(file.type)) return
    form.file = file
  }
}

function handleSave() {
  if (!canSave.value) return
  emit('save', { name: form.name.trim(), category: form.category, file: form.file || undefined })
}
</script>

<style scoped>
.modal-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.modal-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.modal-enter-from { opacity: 0; transform: scale(0.95) translateY(8px); }
.modal-leave-to { opacity: 0; transform: scale(0.98) translateY(-4px); }
</style>
