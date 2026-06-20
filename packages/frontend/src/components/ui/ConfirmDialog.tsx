import { Show } from 'solid-js'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog(props: ConfirmDialogProps) {
  return (
    <Show when={props.open}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-6"
        onKeyDown={(e) => e.key === 'Escape' && props.onCancel()}
      >
        <div
          class="absolute inset-0 bg-black/60"
          onClick={props.onCancel}
          role="presentation"
        />
        <div
          class="relative bg-surface rounded-2xl w-full max-w-xs p-6 shadow-elevated flex flex-col items-center text-center"
          onClick={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-message"
        >
          <div class={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${props.variant === 'danger' ? 'bg-error-container' : 'bg-primary-container'}`}>
            <span class={`material-symbols-outlined text-3xl ${props.variant === 'danger' ? 'text-error' : 'text-primary'}`}>
              {props.variant === 'danger' ? 'delete' : 'help'}
            </span>
          </div>
          <h3 id="confirm-dialog-title" class="text-title-md font-bold text-on-surface mb-2">{props.title}</h3>
          <p id="confirm-dialog-message" class="text-body-sm text-on-surface-variant mb-6">{props.message}</p>
          <div class="flex gap-3 w-full">
            <button
              type="button"
              onClick={props.onCancel}
              class="flex-1 h-11 border border-outline rounded-xl text-on-surface-variant font-bold text-label-md hover:bg-primary/10 hover:text-primary transition-colors tap-target"
            >
              {props.cancelText || '取消'}
            </button>
            <button
              type="button"
              onClick={props.onConfirm}
              class={`flex-1 h-11 rounded-xl font-bold text-label-md hover:opacity-90 active:scale-95 transition-opacity transition-transform tap-target ${props.variant === 'danger' ? 'bg-error text-on-error' : 'bg-primary text-on-primary'}`}
            >
              {props.confirmText || '确认'}
            </button>
          </div>
        </div>
      </div>
    </Show>
  )
}
