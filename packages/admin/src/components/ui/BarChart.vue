<template>
  <div class="flex items-end gap-3 h-full">
    <div
      v-for="(bar, index) in bars"
      :key="index"
      class="flex-1 flex flex-col items-center gap-2 h-full justify-end"
    >
      <div
        class="w-full rounded-t"
        :style="{
          height: bar.height + '%',
          backgroundColor: bar.color || 'var(--color-chart-bar)',
        }"
      />
      <span class="text-[11px] text-text-muted whitespace-nowrap">{{ bar.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  bars: Array<{
    label: string
    height: number
    color?: string
  }>
}>()
</script>
