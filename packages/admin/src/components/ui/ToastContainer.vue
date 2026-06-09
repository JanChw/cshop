<template>
  <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :data-toast-id="toast.id"
      class="pointer-events-auto rounded-lg px-4 py-3 text-sm font-medium shadow-lg flex items-center gap-2 transition-colors"
    :class="{
      'bg-success text-white': toast.type === 'success',
      'bg-danger text-white': toast.type === 'error',
      'bg-primary text-white': toast.type === 'info'
    }"
    >
      <CheckCircle v-if="toast.type === 'success'" :size="16" />
      <XCircle v-if="toast.type === 'error'" :size="16" />
      <Info v-if="toast.type === 'info'" :size="16" />
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, XCircle, Info } from 'lucide-vue-next'
import { useToast } from '../../composables/useToast'

const { toasts } = useToast()
</script>