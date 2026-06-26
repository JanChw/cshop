import { createSignal } from 'solid-js'
import { api } from './api'

const [cartCount, setCartCount] = createSignal(0)
export { cartCount }

function getToken(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage.getItem('cshop_token') || localStorage.getItem('cshop_token')
}

// 拉取购物车并汇总商品件数（quantity 之和）。未登录时归零。
export async function refreshCartCount() {
  if (!getToken()) { setCartCount(0); return }
  try {
    const res = await api.cart.list()
    const count = (res.data || []).reduce(
      (s: number, item: any) => s + (item.quantity || 1),
      0
    )
    setCartCount(count)
  } catch {
    // 保留上次值，避免瞬时网络抖动清零
  }
}
