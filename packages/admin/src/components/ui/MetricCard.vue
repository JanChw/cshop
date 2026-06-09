<template>
  <div ref="cardRef" class="bg-card border border-border rounded-md p-5 flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <span class="text-text-muted text-sm font-medium">{{ label }}</span>
      <component :is="icon" :size="18" class="text-text-muted" />
    </div>
    <span ref="valueRef" class="text-text-primary text-2xl font-bold">{{ displayValue }}</span>
    <span class="text-primary-light text-xs font-medium">{{ change }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Component } from 'vue'

import gsap from 'gsap'

const props = defineProps<{
  label: string
  value: string | number
  change: string
  icon: Component
}>()

const valueRef = ref<HTMLElement | null>(null)
const displayValue = ref(String(props.value))

onMounted(() => {
  const raw = String(props.value)
  const num = parseInt(raw.replace(/[^0-9]/g, ''))
  if (isNaN(num) || !valueRef.value) return

  const prefix = raw.startsWith('¥') ? '¥' : ''
  const hasComma = raw.includes(',')
  const obj = { value: 0 }
  const anim = gsap.to(obj, {
    value: num,
    duration: 1.2,
    ease: 'power2.out',
    onUpdate: () => {
      const n = Math.round(obj.value)
      valueRef.value!.textContent = prefix + (hasComma ? n.toLocaleString() : String(n))
    }
  })
})
</script>