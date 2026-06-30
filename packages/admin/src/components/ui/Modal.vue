<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/50" />
        <div
          class="relative glass rounded-md border border-border flex flex-col shadow-lg"
          :class="widthClass"
        >
          <div v-if="$slots.header || title" class="flex items-center justify-between px-6 py-5 border-b border-border">
            <h2 class="text-base font-semibold text-text-primary">{{ title }}</h2>
            <button class="rounded p-1 text-text-muted hover:text-text-primary transition-colors" @click="$emit('close')">
              <X :size="18" />
            </button>
          </div>
          <div class="px-6 py-6 flex flex-col gap-5">
            <slot />
          </div>
          <div v-if="$slots.footer" class="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  visible: boolean
  title?: string
  width?: number
}>(), {
  width: 480
})

defineEmits<{
  close: []
}>()

const widthClass = computed(() => {
  if (props.width <= 400) return 'w-[400px]'
  if (props.width <= 560) return 'w-[480px]'
  return 'w-[560px]'
})
</script>
