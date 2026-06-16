import { createSignal } from 'solid-js'

interface Chip {
  zh: string
  en?: string
}

interface Props {
  items: Chip[]
  active?: string
  onChange?: (zh: string) => void
  variant?: 'rounded-lg' | 'rounded-full'
}

export default function CategoryChips(props: Props) {
  const [active, setActive] = createSignal(props.active || '全部')

  const handleClick = (zh: string) => {
    setActive(zh)
    props.onChange?.(zh)
  }

  const radius = props.variant === 'rounded-full' ? 'rounded-full' : 'rounded-lg'

  return (
    <div class="flex overflow-x-auto gap-2 pb-2" style={{ '-ms-overflow-style': 'none', 'scrollbar-width': 'none' }}>
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      {props.items.map((chip) => (
        <button
          class={`flex-shrink-0 px-4 py-2 ${radius} text-label-md transition-all active:scale-95 ${
            active() === chip.zh
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
          }`}
          onClick={() => handleClick(chip.zh)}
        >
          {chip.zh}{chip.en ? ` (${chip.en})` : ''}
        </button>
      ))}
    </div>
  )
}
