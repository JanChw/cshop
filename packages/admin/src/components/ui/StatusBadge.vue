<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white w-[70px] justify-center"
    :class="variant ? variantClass : ''"
    :style="!variant ? { backgroundColor: color } : undefined"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  color?: string
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'active' | 'inactive' | 'primary' | 'primary-light' | 'muted'
}>()

const variantClass = computed(() => {
  const map: Record<string, string> = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    active: 'bg-status-active',
    inactive: 'bg-status-inactive',
    primary: 'bg-primary',
    'primary-light': 'bg-primary-light',
    muted: 'bg-gray-400'
  }
  return map[props.variant ?? ''] ?? ''
})
</script>
