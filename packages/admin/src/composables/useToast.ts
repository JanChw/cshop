import { ref, type Ref } from 'vue'
import gsap from 'gsap'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const toasts: Ref<Toast[]> = ref([])
let nextId = 0

export function useToast() {
  function show(message: string, type: Toast['type'] = 'info', duration = 3000) {
    const id = ++nextId
    toasts.value.push({ id, message, type })

    setTimeout(() => {
      dismiss(id)
    }, duration)
  }

  function dismiss(id: number) {
    const el = document.querySelector(`[data-toast-id="${id}"]`)
    if (el) {
      gsap.to(el, {
        opacity: 0, x: 40, duration: 0.25, ease: 'power2.in',
        onComplete: () => {
          toasts.value = toasts.value.filter(t => t.id !== id)
        }
      })
    } else {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }
  }

  function success(message: string) { show(message, 'success') }
  function error(message: string) { show(message, 'error') }
  function info(message: string) { show(message, 'info') }

  return { toasts, show, dismiss, success, error, info }
}
