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
    e.preventDefault()
    const next = !filled()
    setFilled(next)
    props.onToggle?.(next)
  }

  const sizeClass = props.size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'

  return (
    <button
      type="button"
      class={`absolute top-3 right-3 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full text-on-surface shadow-sm tap-target transition-transform active:scale-90 hover:bg-white ${sizeClass} ${props.class || ''}`}
      onClick={toggle}
      aria-label={filled() ? '取消收藏' : '加入收藏'}
      aria-pressed={filled()}
    >
      <span
        class={`material-symbols-outlined ${props.size === 'sm' ? 'text-base' : 'text-[20px]'}`}
        style={`font-variation-settings: 'FILL' ${filled() ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`}
      >
        favorite
      </span>
    </button>
  )
}
