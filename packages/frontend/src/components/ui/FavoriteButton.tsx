import { createSignal } from 'solid-js'

interface Props {
  active?: boolean
  onToggle?: (active: boolean) => void
  size?: 'sm' | 'md'
  class?: string
}

export default function FavoriteButton(props: Props) {
  const [filled, setFilled] = createSignal(props.active || false)

  const toggle = (e: MouseEvent) => {
    e.stopPropagation()
    const next = !filled()
    setFilled(next)
    props.onToggle?.(next)
  }

  const sizeClass = props.size === 'sm' ? 'p-1.5' : 'p-1.5'
  const iconSize = props.size === 'sm' ? 'text-[18px]' : 'text-[20px]'

  return (
    <button
      class={`absolute top-3 right-3 bg-white/80 backdrop-blur-md rounded-full text-on-surface shadow-sm ${sizeClass} ${props.class || ''}`}
      onClick={toggle}
    >
      <span
        class={`material-symbols-outlined ${iconSize}`}
        style={`font-variation-settings: 'FILL' ${filled() ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`}
      >
        favorite
      </span>
    </button>
  )
}
