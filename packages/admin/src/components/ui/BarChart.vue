<template>
  <div ref="containerRef" class="flex items-end gap-3 h-full">
    <div
      v-for="(bar, index) in bars"
      :key="index"
      ref="barRefs"
      class="flex-1 flex flex-col items-center gap-2 h-full justify-end"
    >
      <div
        ref="barInnerRefs"
        class="w-full rounded-t"
        :style="{ backgroundColor: bar.color || 'var(--color-chart-bar)' }"
      />
      <span class="text-xs text-text-muted whitespace-nowrap">{{ bar.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import gsap from 'gsap'

const props = defineProps<{
  bars: Array<{
    label: string
    height: number
    color?: string
  }>
}>()

const containerRef = ref<HTMLElement | null>(null)
const barInnerRefs = ref<HTMLElement[]>([])

onMounted(() => {
  nextTick(() => {
    const bars = containerRef.value?.querySelectorAll('.w-full.rounded-t')
    if (!bars?.length) return

    bars.forEach((el, i) => {
      const h = props.bars[i]?.height ?? 0
      ;(el as HTMLElement).style.height = '0%'
    })

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      bars.forEach((el, i) => {
        ;(el as HTMLElement).style.height = `${props.bars[i]?.height ?? 0}%`
      })
      return
    }

    gsap.to(bars, {
      height: (i: number) => `${props.bars[i]?.height ?? 0}%`,
      duration: 0.6,
      stagger: 0.07,
      ease: 'power2.out',
      delay: 0.1
    })
  })
})
</script>