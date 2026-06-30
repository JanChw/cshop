import { Show, type JSX } from 'solid-js'
import { DESIGN_TOOLS, type DesignTool } from './design-types'

interface Props {
  activeTool: DesignTool | null
  onClose: () => void
  children: JSX.Element
}

export default function PanelSheet(props: Props) {
  const isOpen = () => props.activeTool !== null
  const toolLabel = () => {
    const t = DESIGN_TOOLS.find((t) => t.key === props.activeTool)
    return t?.label ?? ''
  }

  return (
    <>
      {/* Mobile scrim */}
      <Show when={isOpen()}>
        <div
          class="md:hidden absolute inset-0 bg-black/30 z-10 transition-opacity"
          onClick={props.onClose}
        />
      </Show>

      {/* Panel container */}
      <div
        class="absolute z-30 md:translate-y-0
               bottom-14 inset-x-0
               bg-surface rounded-t-2xl border-t border-outline-variant shadow-elevated
               flex flex-col max-h-[50%]
               transition-all duration-300 ease-out
               md:bottom-0 md:inset-x-auto md:left-20 md:top-0
               md:max-h-none md:w-80 md:rounded-none md:rounded-r-2xl md:border md:border-l-0 md:border-outline-variant md:shadow-elevated"
        classList={{
          'translate-y-full md:-translate-x-full opacity-0 pointer-events-none': !isOpen(),
          'translate-y-0 md:translate-x-0 opacity-100': isOpen()
        }}
      >
        {/* Drag handle (mobile only) */}
        <div class="md:hidden flex justify-center pt-2 pb-1 shrink-0">
          <div class="w-9 h-1 rounded-full bg-outline-variant/40" />
        </div>

        {/* Header */}
        <div class="flex items-center justify-between px-4 py-2 shrink-0 border-b border-outline-variant md:border-b">
          <h2 class="text-body-sm font-bold text-on-surface">{toolLabel()}</h2>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors"
            onClick={props.onClose}
            aria-label="关闭面板"
          >
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content */}
        <div class="flex-1 overflow-y-auto p-4 hide-scrollbar">
          {props.children}
        </div>
      </div>
    </>
  )
}
