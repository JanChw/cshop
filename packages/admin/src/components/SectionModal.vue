<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/50" />

        <div class="relative glass rounded-md w-[700px] border border-border flex flex-col max-h-[90vh]">
          <div class="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
            <h2 class="text-base font-semibold text-text-primary">
              {{ section ? '编辑区块' : '新增区块' }}
            </h2>
            <button
              class="rounded p-1 text-text-muted hover:text-text-primary transition-colors"
              @click="$emit('close')"
            >
              <X :size="18" />
            </button>
          </div>

          <div class="px-6 py-6 flex flex-col gap-5 overflow-y-auto">
            <!-- Type -->
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">区块类型</label>
              <select
                v-model="form.type"
                class="w-full h-9 rounded border border-border px-3 text-sm text-text-primary outline-none focus:border-primary transition-colors"
                :disabled="!!section"
              >
                <option value="hero">主横幅 (Hero)</option>
                <option value="videos">教学视频</option>
                <option value="product_row">商品行</option>
                <option value="card_grid">卡片网格</option>
                <option value="designer_grid">联名设计师</option>
              </select>
            </div>

            <!-- Common: title -->
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">标题</label>
              <input
                v-model="form.title"
                type="text"
                placeholder="如 ByChooow Studio / Learn / Basics"
                class="h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
              />
            </div>

            <!-- Common: sub_title -->
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">副标题</label>
              <input
                v-model="form.subTitle"
                type="text"
                placeholder="如 将创意，转化为高级成衣。"
                class="h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
              />
            </div>

            <!-- hero: images -->
            <div v-if="form.type === 'hero'" class="flex flex-col gap-4">
              <p class="text-xs font-medium text-text-muted uppercase">Hero 背景图</p>
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-text-primary">移动端图片 URL</label>
                <input v-model="form.heroMobile" type="text" placeholder="https://..." class="h-9 rounded border border-border px-3 text-sm text-text-primary font-mono placeholder:text-text-muted outline-none focus:border-primary transition-colors" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-text-primary">平板端图片 URL</label>
                <input v-model="form.heroTablet" type="text" placeholder="https://..." class="h-9 rounded border border-border px-3 text-sm text-text-primary font-mono placeholder:text-text-muted outline-none focus:border-primary transition-colors" />
              </div>
            </div>

            <!-- videos: video list -->
            <div v-if="form.type === 'videos'" class="flex flex-col gap-4">
              <div class="flex items-center justify-between">
                <p class="text-xs font-medium text-text-muted uppercase">视频列表</p>
                <button class="rounded bg-primary text-white text-xs font-medium h-8 px-3 flex items-center gap-1 hover:bg-primary/90" @click="addVideo">
                  <Plus :size="12" /> 添加视频
                </button>
              </div>
              <div v-for="(v, i) in form.videoList" :key="i" class="flex gap-2 items-start border border-border rounded p-3">
                <div class="flex flex-col gap-2 flex-1">
                  <input v-model="v.title" type="text" placeholder="视频标题" class="h-8 rounded border border-border px-2 text-sm outline-none focus:border-primary" />
                  <input v-model="v.image" type="text" placeholder="封面图 URL" class="h-8 rounded border border-border px-2 text-sm font-mono outline-none focus:border-primary" />
                  <input v-model="v.duration" type="text" placeholder="时长 (如 12:35)" class="h-8 rounded border border-border px-2 text-sm w-24 outline-none focus:border-primary" />
                </div>
                <button class="rounded p-1 text-danger hover:bg-red-50 shrink-0 mt-1" @click="form.videoList.splice(i, 1)">
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>

            <!-- Content types: ProductPicker -->
            <div v-if="contentTypes.includes(form.type)" class="flex flex-col gap-2">
              <p class="text-xs font-medium text-text-muted uppercase">商品选择</p>
              <ProductPicker
                :model-value="form.contentItems"
                :type="form.type"
                @update:model-value="form.contentItems = $event"
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
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
              {{ section ? '确认修改' : '确认添加' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { X, Check, Plus, Trash2 } from 'lucide-vue-next'
import ProductPicker from './ProductPicker.vue'

interface ContentItem { productId: number; cover?: string | null }
interface VideoItem { title: string; image: string; duration: string }

const props = defineProps<{
  visible: boolean
  section?: { id: number; type: string; title: string | null; subTitle: string | null; data: string }
}>()

const emit = defineEmits<{
  close: []
  save: [data: { type: string; title: string; subTitle: string; data: string }]
}>()

const contentTypes = ['product_row', 'card_grid', 'designer_grid']

const form = reactive({
  type: 'hero' as string,
  title: '',
  subTitle: '',
  heroMobile: '',
  heroTablet: '',
  videoList: [] as VideoItem[],
  contentItems: [] as ContentItem[]
})

watch(() => props.visible, (val) => {
  if (!val) return
  form.type = props.section?.type || 'hero'
  form.title = props.section?.title || ''
  form.subTitle = props.section?.subTitle || ''
  form.heroMobile = ''
  form.heroTablet = ''
  form.videoList = []
  form.contentItems = []

  if (props.section?.data) {
    try {
      const d = JSON.parse(props.section.data)
      if (form.type === 'hero') {
        form.heroMobile = d.images?.find((im: any) => im.device === 'mobile')?.url || ''
        form.heroTablet = d.images?.find((im: any) => im.device === 'tablet')?.url || ''
      } else if (form.type === 'videos') {
        form.videoList = d.videos || []
      } else if (contentTypes.includes(form.type)) {
        form.contentItems = d.contents || []
      }
    } catch { /* ignore */ }
  }
})

function addVideo() {
  form.videoList.push({ title: '', image: '', duration: '' })
}

function handleSave() {
  let data: string
  if (form.type === 'hero') {
    data = JSON.stringify({
      images: [
        { device: 'mobile', url: form.heroMobile },
        { device: 'tablet', url: form.heroTablet }
      ]
    })
  } else if (form.type === 'videos') {
    data = JSON.stringify({ videos: form.videoList })
  } else {
    data = JSON.stringify({ contents: form.contentItems })
  }
  emit('save', { type: form.type, title: form.title, subTitle: form.subTitle, data })
}
</script>
