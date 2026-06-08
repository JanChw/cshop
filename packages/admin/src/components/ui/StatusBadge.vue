<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white w-[70px] justify-center"
    :style="{ backgroundColor: color }"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  color: string
}>()
</script>
