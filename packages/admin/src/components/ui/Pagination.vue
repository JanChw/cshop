<template>
  <div class="flex items-center justify-between">
    <span class="text-sm text-text-muted">{{ displayLabel }}</span>
    <div class="flex items-center gap-1">
      <button
        class="w-8 h-8 rounded border border-border bg-white text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-colors"
        :disabled="currentPage === 1"
        @click="$emit('update:currentPage', currentPage - 1)"
      >
        <ChevronLeft :size="14" />
      </button>
      <button
        v-for="page in pageNumbers"
        :key="page"
        class="w-8 h-8 rounded text-sm flex items-center justify-center transition-colors"
        :class="page === currentPage
          ? 'bg-primary text-white'
          : 'bg-white border border-border text-text-primary hover:bg-gray-50'"
        @click="$emit('update:currentPage', page)"
      >
        {{ page }}
      </button>
      <button
        class="w-8 h-8 rounded border border-border bg-white text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-colors"
        :disabled="currentPage === totalPages"
        @click="$emit('update:currentPage', currentPage + 1)"
      >
        <ChevronRight :size="14" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  currentPage: number
  totalPages: number
  total: number
  perPage?: number
  label?: string
}>()

defineEmits<{
  'update:currentPage': [page: number]
}>()

const pageNumbers = computed(() => {
  const pages: number[] = []
  for (let i = 1; i <= props.totalPages; i++) {
    pages.push(i)
  }
  return pages
})

const displayLabel = computed(() => {
  if (props.label) return props.label
  return `共 ${props.total} 条，每页 ${props.perPage ?? 8} 条`
})
</script>
