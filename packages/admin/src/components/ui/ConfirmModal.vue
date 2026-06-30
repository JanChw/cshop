<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="$emit('cancel')"
      >
        <div class="absolute inset-0 bg-black/50" />
        <div class="relative glass rounded-md w-[420px] border border-border p-7 flex flex-col gap-5">
          <h3 class="text-base font-semibold" :class="variant === 'danger' ? 'text-danger' : 'text-text-primary'">
            {{ title }}
          </h3>
          <div class="text-sm text-text-muted">
            <slot />
          </div>
          <div class="flex items-center justify-end gap-3">
            <button
              class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
              @click="$emit('cancel')"
            >
              {{ cancelLabel }}
            </button>
            <button
              class="h-10 rounded px-4 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :class="variant === 'danger' ? 'bg-danger hover:bg-danger/90' : 'bg-primary hover:bg-primary/90'"
              :disabled="disabled"
              @click="$emit('confirm')"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  visible: boolean
  title: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'danger'
  disabled?: boolean
}>(), {
  confirmLabel: '确认',
  cancelLabel: '取消',
  variant: 'primary',
  disabled: false
})

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>
