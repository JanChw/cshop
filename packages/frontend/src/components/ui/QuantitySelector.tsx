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
    <div class="flex items-center border border-outline-variant rounded-lg">
      <button class="px-3 py-1 text-on-surface hover:bg-surface-container transition-colors active:scale-95" onClick={() => update(-1)}>-</button>
      <span class="px-4 py-1 font-bold text-body-sm">{value()}</span>
      <button class="px-3 py-1 text-on-surface hover:bg-surface-container transition-colors active:scale-95" onClick={() => update(1)}>+</button>
    </div>
  )
}
