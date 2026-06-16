import { createSignal, createMemo } from 'solid-js'
import QuantitySelector from '../ui/QuantitySelector'
import { showToast } from '../../lib/toast'

interface CartItem {
  id: string
  name: string
  image: string
  price: number
  size: string
  color: string
  designId?: string
}

interface Props {
  items: CartItem[]
}

export default function CartContent(props: Props) {
  const [items, setItems] = createSignal(props.items.map((item) => ({ ...item, qty: 1 })))
  const [couponInput, setCouponInput] = createSignal('')
  const [discount, setDiscount] = createSignal(0)
  const [couponApplied, setCouponApplied] = createSignal(false)

  const subtotal = createMemo(() => items().reduce((s, item) => s + item.price * item.qty, 0))
  const total = createMemo(() => Math.max(0, subtotal() - discount()))
  const itemCount = createMemo(() => items().reduce((s, item) => s + item.qty, 0))

  const updateQty = (id: string, qty: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, qty } : item)))
  }

  const removeItem = (id: string) => {
    if (confirm('确定要移除此商品吗？')) {
      setItems((prev) => prev.filter((item) => item.id !== id))
      showToast('已移除')
    }
  }

  const applyCoupon = () => {
    const code = couponInput().trim().toUpperCase()
    if (!code) { showToast('请输入优惠码'); return }
    if (code === 'SAHARA10') {
      setDiscount(Math.round(subtotal() * 0.1 * 100) / 100)
      setCouponApplied(true)
      showToast('优惠已应用')
    } else {
      showToast('无效优惠码')
    }
  }

  const checkout = () => {
    const orig = document.querySelector('.checkout-btn')?.innerHTML
    const btn = document.querySelector('.checkout-btn') as HTMLButtonElement
    if (btn) {
      btn.disabled = true
      btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span>'
      setTimeout(() => {
        btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> 已提交'
        btn.classList.add('bg-green-600')
        setTimeout(() => { btn.innerHTML = '结算 <span class="material-symbols-outlined">arrow_forward</span>'; btn.disabled = false; btn.classList.remove('bg-green-600') }, 2000)
      }, 1200)
    }
  }

  return (
    <main class="pt-16 pb-32 px-container-margin min-h-screen">
      <div class="grid grid-cols-1 gap-gutter">
        <section class="lg:col-span-8 space-y-stack-md">
          {items().length === 0 && (
            <div class="flex flex-col items-center justify-center py-20 text-center">
              <span class="material-symbols-outlined text-outline text-6xl mb-4">shopping_cart</span>
              <p class="text-on-surface-variant text-body-lg">购物车是空的</p>
              <a href="/shop" class="mt-4 text-primary font-bold hover:underline">去逛逛</a>
            </div>
          )}
          {items().map((item) => (
            <div class="bg-surface-container-lowest p-stack-md rounded-lg border border-outline-variant flex gap-4 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(194,101,42,0.08)] transition-all duration-200">
              <div class="w-24 h-30 flex-shrink-0 bg-surface-container-low rounded-lg overflow-hidden">
                <img alt={item.name} class="w-full h-full object-cover" src={item.image} />
              </div>
              <div class="flex-grow flex flex-col justify-between">
                <div>
                  <div class="flex justify-between">
                    <h3 class="text-body-lg text-on-surface">{item.name}</h3>
                    <button class="text-outline hover:text-error transition-colors" onClick={() => removeItem(item.id)}>
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                  <p class="text-body-sm text-on-surface-variant mt-1">{item.color} / {item.size} / 纯棉</p>
                  {item.designId && <p class="text-body-sm text-primary font-bold mt-1">设计ID: {item.designId}</p>}
                </div>
                <div class="flex justify-between items-end mt-4">
                  <QuantitySelector value={item.qty} min={1} onChange={(qty) => updateQty(item.id, qty)} />
                  <span class="text-title-md font-bold text-primary">¥ {(item.price * item.qty).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </section>
        <aside class="lg:col-span-4">
          <div class="sticky top-20 space-y-stack-md">
            <div class="bg-surface-container-lowest p-stack-md rounded-lg border border-outline-variant">
              <label class="block text-label-md text-on-surface-variant mb-2">优惠券代码</label>
              <div class="flex gap-2">
                <input class="flex-grow bg-background border border-outline-variant rounded-lg px-4 py-2 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="输入优惠码" value={couponInput()} onInput={(e) => setCouponInput(e.currentTarget.value)} />
                <button class="bg-primary text-on-primary font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity" onClick={applyCoupon} disabled={couponApplied()}>{couponApplied() ? '✓ 已应用' : '应用'}</button>
              </div>
            </div>
            <div class="bg-surface-container-lowest p-stack-md rounded-lg border border-outline-variant">
              <h2 class="text-title-md text-on-surface mb-4">订单摘要</h2>
              <div class="space-y-3">
                <div class="flex justify-between text-body-sm text-on-surface-variant">
                  <span>商品小计</span>
                  <span id="cart-subtotal">¥ {subtotal().toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-body-sm text-on-surface-variant">
                  <span>运费</span>
                  <span class="text-primary font-bold">免运费</span>
                </div>
                <div class="flex justify-between text-body-sm text-on-surface-variant">
                  <span>优惠减免</span>
                  <span class="text-error">- ¥ {discount().toFixed(2)}</span>
                </div>
                <div class="pt-4 border-t border-outline-variant flex justify-between items-baseline">
                  <span class="font-bold text-body-lg text-on-surface">订单总计</span>
                  <span class="text-display-lg font-headline text-primary tracking-tight">¥ {total().toFixed(2)}</span>
                </div>
              </div>
              <button class="checkout-btn w-full mt-6 bg-primary text-on-primary font-bold py-4 rounded-lg hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/10 flex justify-center items-center gap-2" onClick={checkout}>
                <span>结算</span>
                <span class="material-symbols-outlined">arrow_forward</span>
              </button>
              <p class="text-center text-label-md text-outline mt-4">支持 7 天无理由退换货</p>
            </div>
            <div class="flex justify-around items-center px-4 py-2">
              <div class="flex flex-col items-center gap-1 group"><span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">verified_user</span><span class="text-[10px] text-outline group-hover:text-on-surface-variant">安全支付</span></div>
              <div class="flex flex-col items-center gap-1 group"><span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">local_shipping</span><span class="text-[10px] text-outline group-hover:text-on-surface-variant">顺丰包邮</span></div>
              <div class="flex flex-col items-center gap-1 group"><span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">support_agent</span><span class="text-[10px] text-outline group-hover:text-on-surface-variant">在线客服</span></div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
