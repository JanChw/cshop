import { createSignal, onMount } from 'solid-js'
import { api, isLoggedIn } from '../../lib/api'
import { showToast } from '../../lib/toast'

interface Props {
  productId?: string | number
  active?: boolean
  onToggle?: (active: boolean) => void
  size?: 'sm' | 'md'
  class?: string
}

export default function FavoriteButton(props: Props) {
  const [filled, setFilled] = createSignal(props.active || false)
  const [busy, setBusy] = createSignal(false)

  onMount(async () => {
    if (props.productId === undefined || !isLoggedIn()) return
    try {
      const res: any = await api.favorites.check(Number(props.productId))
      if (res.success) setFilled(res.data.favorited)
    } catch { /* ignore */ }
  })

  const toggle = async (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (props.productId === undefined) {
      const next = !filled()
      setFilled(next)
      props.onToggle?.(next)
      return
    }
    if (!isLoggedIn()) {
      showToast('请先登录')
      return
    }
    if (busy()) return
    setBusy(true)
    const next = !filled()
    try {
      if (next) await api.favorites.add(Number(props.productId))
      else await api.favorites.remove(Number(props.productId))
      setFilled(next)
      props.onToggle?.(next)
      showToast(next ? '已加入收藏' : '已取消收藏')
    } catch (err: any) {
      showToast(err.message || '操作失败')
    } finally {
      setBusy(false)
    }
  }

  const sizeClass = props.size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'

  return (
    <button
      type="button"
      class={`absolute top-3 right-3 flex items-center justify-center bg-surface backdrop-blur-md rounded-full ${filled() ? 'text-accent' : 'text-on-surface'} tap-target transition-transform duration-200 active:scale-90 hover:bg-surface-container ${sizeClass} ${props.class || ''}`}
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
