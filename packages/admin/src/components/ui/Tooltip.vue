<template>
  <div
    class="relative inline-flex"
    @mouseenter="show"
    @mouseleave="hide"
  >
    <slot />
    <Teleport to="body">
      <div
        v-if="visible"
        ref="tipRef"
        class="fixed z-[9999] px-2 py-1 bg-tooltip-bg text-white text-[11px] leading-tight whitespace-nowrap rounded shadow-lg pointer-events-none"
        :style="{ left: x + 'px', top: y + 'px', transform: 'translate(-50%, -100%)' }"
      >
        {{ text }}
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

defineProps<{
  text: string
}>()

const visible = ref(false)
const tipRef = ref<HTMLElement | null>(null)
const x = ref(0)
const y = ref(0)

function show(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  x.value = rect.left + rect.width / 2
  y.value = rect.top - 6
  visible.value = true
}

function hide() {
  visible.value = false
}
</script>
