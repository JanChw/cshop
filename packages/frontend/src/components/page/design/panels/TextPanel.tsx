import { createSignal, createEffect } from 'solid-js'

interface Props {
  editingText?: { text: string } | null
  onAddText: (opts: { text: string }) => void
  onUpdateText?: (opts: { text: string }) => void
}

export default function TextPanel(props: Props) {
  const isEditing = () => props.editingText != null

  const [text, setText] = createSignal('')

  createEffect(() => {
    const initial = props.editingText
    if (initial) {
      setText(initial.text)
    } else {
      setText('')
    }
  })

  const apply = () => {
    const t = text().trim()
    if (!t) return
    if (isEditing() && props.onUpdateText) {
      props.onUpdateText({ text: t })
    } else {
      props.onAddText({ text: t })
      setText('')
    }
  }

  return (
    <div class="p-6 space-y-6">
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <label class="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            {isEditing() ? '编辑文字' : '文字内容'}
          </label>
          <span class="text-xs text-secondary">{text().length}/50</span>
        </div>
        <div class="relative">
          <textarea
            class="w-full p-4 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none min-h-[100px] text-lg resize-none transition-shadow placeholder:text-outline-variant/60"
            placeholder="输入文字..."
            value={text()}
            maxLength={50}
            onInput={(e) => setText(e.currentTarget.value)}
          />
        </div>
      </div>

      <div class="bg-tertiary-container text-on-tertiary-container rounded-lg p-4 flex gap-3 items-start">
        <span class="material-symbols-outlined text-tertiary shrink-0">info</span>
        <p class="text-xs leading-relaxed">
          添加后可在画布上选中文字，使用浮动工具条修改颜色、字体、字号等样式。
        </p>
      </div>

      <div class="pt-2">
        <button
          class="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50"
          onClick={apply}
          disabled={!text().trim()}
        >
          {isEditing() ? '更新文字' : '应用到设计'}
        </button>
      </div>
    </div>
  )
}
