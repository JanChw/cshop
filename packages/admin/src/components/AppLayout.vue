<template>
  <div class="flex min-h-screen bg-background">
    <AppSidebar class="sticky top-0 h-screen shrink-0" />
    <div class="flex-1 flex flex-col min-w-0">
      <AppHeader class="sticky top-0 z-10" />
      <main>
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
</script>
