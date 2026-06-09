<template>
  <div class="flex items-center gap-1.5">
    <button
      v-for="t in themes"
      :key="t.key"
      class="w-5 h-5 rounded-full border-2 transition-all"
      :class="current === t.key
        ? 'border-primary scale-110'
        : 'border-transparent hover:scale-105'"
      :style="{ backgroundColor: t.color }"
      :title="t.label"
      @click="setTheme(t.key)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const STORAGE_KEY = 'cshop-theme'

interface Theme {
  key: string
  label: string
  color: string
}

const themes: Theme[] = [
  { key: 'forest', label: '森林绿', color: '#2D5E3A' },
  { key: 'blue', label: '海洋蓝', color: '#2563EB' },
  { key: 'purple', label: '星空紫', color: '#7C3AED' },
]

const current = ref('forest')

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && themes.some((t) => t.key === saved)) {
    current.value = saved
    document.documentElement.setAttribute('data-theme', saved)
  } else {
    document.documentElement.setAttribute('data-theme', 'forest')
  }
})

function setTheme(key: string) {
  current.value = key
  localStorage.setItem(STORAGE_KEY, key)
  document.documentElement.setAttribute('data-theme', key)
}
</script>
