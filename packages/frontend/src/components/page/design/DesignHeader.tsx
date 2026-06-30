import { Show, createEffect } from 'solid-js'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface Props {
  designName: string
  editingName: boolean
  nameDraft: string
  saveState: SaveState
  dirty: boolean
  currentDesignId: number | null
  ready: boolean
  onSave: () => void
  onStartEditName: () => void
  onCommitName: () => void
  onCancelEditName: () => void
  onNameDraftChange: (v: string) => void
}

export default function DesignHeader(props: Props) {
  let nameInputRef: HTMLInputElement | undefined

  createEffect(() => {
    if (props.editingName && nameInputRef) {
      nameInputRef.focus()
    }
  })

  const dirtyDot = () => props.dirty && props.currentDesignId !== null

  const indicator = () => {
    if (!props.ready) return { text: '加载中...', color: 'text-secondary' }
    const s = props.saveState
    if (s === 'saving') return { text: '保存中...', color: 'text-secondary' }
    if (s === 'error') return { text: '保存失败', color: 'text-error' }
    if (props.currentDesignId === null) return { text: '未保存', color: 'text-secondary' }
    if (props.dirty) return { text: '有未保存修改', color: 'text-secondary' }
    return { text: '已保存', color: 'text-primary' }
  }

  return (
    <header class="shrink-0 bg-surface relative z-40 flex justify-between items-center px-4 h-14 w-full border-b border-outline-variant">
      <div class="flex flex-col items-center min-w-0">
        <Show
          when={props.editingName}
          fallback={
            <button
              class="font-headline text-base font-bold tracking-tight text-primary leading-tight flex items-center gap-1 max-w-[60vw]"
              onClick={props.onStartEditName}
              aria-label="编辑设计名称"
            >
              <span class="truncate">{props.designName}</span>
              <span class="material-symbols-outlined text-sm text-secondary shrink-0">edit</span>
            </button>
          }
        >
          <input
            aria-label="设计名称"
            ref={(el) => { nameInputRef = el }}
            class="font-headline text-base font-bold tracking-tight text-primary leading-tight text-center bg-transparent border-b-2 border-primary outline-none min-w-40 max-w-[50vw]"
            value={props.nameDraft}
            onInput={(e) => props.onNameDraftChange(e.currentTarget.value)}
            onBlur={props.onCommitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') props.onCommitName()
              if (e.key === 'Escape') props.onCancelEditName()
            }}
            maxLength={40}
          />
        </Show>
        <div class="flex items-center gap-1.5 leading-none">
          <Show when={dirtyDot()}>
            <span class="w-1.5 h-1.5 rounded-full bg-error" />
          </Show>
          <span class={`text-label-md font-medium ${indicator().color}`}>
            {indicator().text}
          </span>
        </div>
      </div>

      <button
        class="p-2 hover:bg-primary/10 hover:text-primary rounded-full transition-colors active:scale-95 disabled:opacity-40"
        onClick={props.onSave}
        aria-label="保存"
        disabled={props.saveState === 'saving'}
      >
        <span class="material-symbols-outlined text-primary">bookmark</span>
      </button>
    </header>
  )
}
