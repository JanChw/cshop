<template>
  <div
    class="flex items-center gap-2 rounded border border-border bg-white transition-colors"
    :class="[
      size === 'sm' ? 'h-9 px-2.5' : 'h-10 px-3',
      wrapperClass
    ]"
  >
    <Search :size="16" class="text-text-muted shrink-0" />
    <input
      :value="modelValue"
      type="text"
      :aria-label="ariaLabel"
      :placeholder="placeholder"
      class="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
import { Search } from 'lucide-vue-next'

defineProps<{
  modelValue: string
  placeholder?: string
  ariaLabel?: string
  size?: 'sm' | 'default'
  wrapperClass?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
