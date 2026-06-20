import { createSignal } from 'solid-js'

interface Props {
  value?: number
  min?: number
  onChange?: (value: number) => void
}

export default function QuantitySelector(props: Props) {
  const [value, setValue] = createSignal(props.value || 1)

  const update = (delta: number) => {
    const next = value() + delta
    if (next >= (props.min ?? 1)) {
      setValue(next)
      props.onChange?.(next)
    }
  }

  return (
    <div class="flex items-center border border-outline-variant rounded-lg" role="group" aria-label="数量选择">
      <button class="tap-target flex items-center justify-center min-w-[44px] text-on-surface hover:bg-surface-container transition-colors active:scale-95" onClick={() => update(-1)} aria-label="减少数量">-</button>
      <span class="w-10 text-center font-bold text-body-sm" aria-live="polite">{value()}</span>
      <button class="tap-target flex items-center justify-center min-w-[44px] text-on-surface hover:bg-surface-container transition-colors active:scale-95" onClick={() => update(1)} aria-label="增加数量">+</button>
    </div>
  )
}
