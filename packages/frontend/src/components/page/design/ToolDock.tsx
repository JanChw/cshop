import { For, Show } from 'solid-js'
import { DESIGN_TOOLS, type DesignTool } from './design-types'

interface Props {
  activeTool: DesignTool | null
  onToolChange: (tool: DesignTool) => void
}

export default function ToolDock(props: Props) {
  return (
    <div
      class="absolute z-50
             bottom-0 inset-x-0 h-14 flex flex-row items-center justify-around
             bg-surface/95 backdrop-blur-md border-t border-outline-variant
             md:bottom-auto md:inset-x-auto md:left-4 md:top-1/2 md:-translate-y-1/2
             md:h-auto md:flex-col md:gap-1 md:p-2 md:rounded-2xl
             md:border md:border-outline-variant md:bg-surface/90 md:backdrop-blur-md md:shadow-elevated"
    >
      <For each={DESIGN_TOOLS}>
        {(tool) => {
          const isActive = () => props.activeTool === tool.key
          return (
            <button
              class="flex flex-col items-center justify-end pb-1.5 gap-0.5 tap-target rounded-lg transition-colors md:justify-center md:pb-0"
              classList={{
                'text-primary': isActive(),
                'text-on-surface-variant hover:text-primary hover:bg-primary/10': !isActive()
              }}
              onClick={() => props.onToolChange(tool.key)}
              aria-label={tool.label}
              aria-pressed={isActive()}
            >
              <span
                class="material-symbols-outlined text-xl"
                style={isActive() ? { 'font-variation-settings': "'FILL' 1" } : {}}
              >
                {tool.icon}
              </span>
              <span class="text-[10px] font-medium hidden md:block">{tool.label}</span>
              <Show when={isActive()}>
                <span class="w-8 h-1 rounded-full bg-primary" />
              </Show>
            </button>
          )
        }}
      </For>
    </div>
  )
}
