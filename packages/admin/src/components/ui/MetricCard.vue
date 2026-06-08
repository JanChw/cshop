<template>
  <div class="bg-card border border-border rounded-md p-5 flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <span class="text-text-muted text-[13px] font-medium">{{ label }}</span>
      <component :is="icon" :size="18" class="text-text-muted" />
    </div>
    <span class="text-text-primary text-[28px] font-bold">{{ value }}</span>
    <span class="text-primary-light text-xs font-medium">{{ change }}</span>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  value: string | number
  change: string
  icon: Component
}>()
</script>
