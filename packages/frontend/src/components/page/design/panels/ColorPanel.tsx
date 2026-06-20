import { For } from 'solid-js'
import { TSHIRT_COLORS } from '../design-types'
import { showToast } from '../../../../lib/toast'

interface Props {
  selectedColor: string
  onColorChange: (hex: string) => void
}

function toHex(value: string) {
  const hex = value.startsWith('#') ? value : `#${value}`
  return hex.toUpperCase()
}

async function copyHex(hex: string) {
  try {
    await navigator.clipboard.writeText(hex)
    showToast('色号已复制')
  } catch {
    showToast('复制失败')
  }
}

export default function ColorPanel(props: Props) {
  const displayHex = () => toHex(props.selectedColor)

  return (
    <section class="mt-6 mb-12 space-y-8">
      <div class="p-4 bg-surface-container-low rounded-xl border border-outline-variant">
        <div class="flex items-center justify-between gap-4">
          <label
            class="relative w-16 h-16 rounded-full overflow-hidden shrink-0 cursor-pointer shadow-sm ring-2 ring-outline-variant ring-offset-2 ring-offset-surface"
            style={{ 'background-color': props.selectedColor }}
            aria-label="打开色盘"
          >
            <input
              type="color"
              class="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 border-0 opacity-0 cursor-pointer"
              value={props.selectedColor}
              onInput={(e) => props.onColorChange(e.currentTarget.value)}
            />
          </label>

          <span class="text-xl font-mono font-bold text-on-surface tracking-wide">
            {displayHex()}
          </span>

          <button
            type="button"
            class="flex items-center justify-center w-11 h-11 rounded-full hover:bg-primary/10 text-secondary hover:text-primary transition-colors"
            onClick={() => copyHex(displayHex())}
            title="点击复制色号"
            aria-label="复制色号"
          >
            <span class="material-symbols-outlined text-xl">content_copy</span>
          </button>
        </div>
      </div>

      <div>
        <h3 class="text-label-md font-medium text-on-surface-variant mb-4">
          预设颜色
        </h3>
        <div class="grid grid-cols-3 gap-6">
          <For each={TSHIRT_COLORS}>
            {(c) => {
              const isSelected = () => props.selectedColor.toUpperCase() === c.hex.toUpperCase()
              return (
                <div
                  class="flex flex-col items-center gap-2 cursor-pointer group"
                  onClick={() => props.onColorChange(c.hex)}
                >
                  <div
                    class="w-16 h-16 rounded-full border border-outline-variant relative flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{
                      'background-color': c.hex,
                      outline: isSelected() ? '2px solid var(--color-primary)' : 'none',
                      'outline-offset': '2px'
                    }}
                  >
                    {isSelected() && (
                      <span
                        class="material-symbols-outlined text-primary text-lg"
                        style="font-variation-settings: 'FILL' 1"
                      >
                        check_circle
                      </span>
                    )}
                  </div>
                  <span
                    class={`text-xs font-medium ${
                      isSelected() ? 'text-on-surface' : 'text-secondary'
                    }`}
                  >
                    {c.name}
                  </span>
                </div>
              )
            }}
          </For>
        </div>
      </div>
    </section>
  )
}
