import ScrollRow from '../ui/ScrollRow'

interface Chip {
  zh: string
  en?: string
}

interface Props {
  items: Chip[]
  active?: string
  onChange?: (zh: string) => void
  variant?: 'rounded-lg' | 'rounded-full'
  class?: string
}

export default function CategoryChips(props: Props) {
  const active = () => props.active || '全部'

  const handleClick = (zh: string) => {
    props.onChange?.(zh)
  }

  const radius = props.variant === 'rounded-full' ? 'rounded-full' : 'rounded-lg'

  return (
    <ScrollRow class={`flex overflow-x-auto gap-2 pb-2 pr-container-margin hide-scrollbar ${props.class ?? ''}`.trimEnd()}>
      {props.items.map((chip) => (
        <button
          type="button"
          class={`flex-shrink-0 px-4 py-2 ${radius} text-label-md transition-transform active:scale-95 tap-target ${
            active() === chip.zh
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
          }`}
          onClick={() => handleClick(chip.zh)}
        >
          {chip.zh}{chip.en ? <span class="hidden md:inline"> ({chip.en})</span> : ''}
        </button>
      ))}
    </ScrollRow>
  )
}
