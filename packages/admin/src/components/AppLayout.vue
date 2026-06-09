<template>
  <div class="flex min-h-screen bg-background">
    <AppSidebar class="sticky top-0 h-screen shrink-0" />
    <div class="flex-1 flex flex-col min-w-0">
      <AppHeader class="sticky top-0 z-10" />
      <main ref="mainRef" class="animate-fade-in">
        <slot />
      </main>
    </div>
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGsap } from '../composables/useGsap'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import ToastContainer from './ui/ToastContainer.vue'

const { staggerIn } = useGsap()
const mainRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (mainRef.value) {
    staggerIn(mainRef.value.children, { y: 16, duration: 0.3, stagger: 0.06 })
  }
})
</script>
