import { createSignal, createMemo, Show } from 'solid-js'
import QuantitySelector from '../ui/QuantitySelector'
import ProductImage from '../ui/ProductImage'
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
  const [checkoutState, setCheckoutState] = createSignal<'idle' | 'submitting' | 'done'>('idle')

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
    setCheckoutState('submitting')
    setTimeout(() => {
      setCheckoutState('done')
      showToast('订单已提交')
      setTimeout(() => setCheckoutState('idle'), 2000)
    }, 1200)
  }

  const OrderSummary = () => (
    <div class="bg-surface-container-lowest p-stack-md rounded-lg border border-outline-variant">
      <h2 class="text-title-md text-on-surface mb-4">订单摘要</h2>
      <div class="space-y-3">
        <div class="flex justify-between text-body-sm text-on-surface-variant">
          <span>商品小计</span>
          <span>¥ {subtotal().toFixed(2)}</span>
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
      <button
        type="button"
        class="w-full mt-6 font-bold py-4 rounded-lg transition-all active:scale-95 shadow-lg shadow-primary/10 flex justify-center items-center gap-2 tap-target disabled:opacity-60"
        classList={{
          'bg-primary text-on-primary hover:opacity-90': checkoutState() !== 'done',
          'bg-green-600 text-white': checkoutState() === 'done'
        }}
        onClick={checkout}
        disabled={checkoutState() !== 'idle'}
      >
        <Show when={checkoutState() === 'submitting'}>
          <span class="material-symbols-outlined animate-spin">progress_activity</span>
        </Show>
        <Show when={checkoutState() === 'done'}>
          <span class="material-symbols-outlined">check_circle</span>
          <span>已提交</span>
        </Show>
        <Show when={checkoutState() === 'idle'}>
          <span>结算</span>
          <span class="material-symbols-outlined">arrow_forward</span>
        </Show>
      </button>
      <p class="text-center text-label-md text-outline mt-4">支持 7 天无理由退换货</p>
    </div>
  )

  return (
    <main class="pt-12 md:pt-20 pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-8 min-h-screen container-content">
      <div class="md:flex md:gap-6">
        <section class="md:w-3/5 space-y-stack-md">
          <Show when={items().length === 0}>
            <div class="flex flex-col items-center justify-center py-20 text-center">
              <span class="material-symbols-outlined text-outline text-6xl mb-4">shopping_cart</span>
              <p class="text-on-surface-variant text-body-lg">购物车是空的</p>
              <a href="/shop" class="mt-4 text-primary font-bold hover:underline tap-target">去逛逛</a>
            </div>
          </Show>
          {items().map((item) => (
            <div class="bg-surface-container-lowest p-stack-md rounded-lg border border-outline-variant flex gap-4 transition-shadow hover:shadow-card">
              <div class="w-24 h-30 flex-shrink-0">
                <ProductImage src={item.image} alt={item.name} aspect="aspect-[4/5]" rounded="rounded-lg" fallbackLabel={item.name} />
              </div>
              <div class="flex-grow flex flex-col justify-between min-w-0">
                <div>
                  <div class="flex justify-between gap-2">
                    <h3 class="text-body-lg text-on-surface truncate">{item.name}</h3>
                    <button
                      type="button"
                      class="tap-target flex items-center justify-center text-outline hover:text-error transition-colors shrink-0"
                      onClick={() => removeItem(item.id)}
                      aria-label="移除商品"
                    >
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

        <aside class="hidden md:block md:w-2/5">
          <div class="sticky top-20 space-y-stack-md">
            <div class="bg-surface-container-lowest p-stack-md rounded-lg border border-outline-variant">
              <label class="block text-label-md text-on-surface-variant mb-2">优惠券代码</label>
              <div class="flex gap-2">
                <input
                  class="flex-grow bg-background border border-outline-variant rounded-lg px-4 py-2 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="输入优惠码"
                  value={couponInput()}
                  onInput={(e) => setCouponInput(e.currentTarget.value)}
                />
                <button
                  type="button"
                  class="bg-primary text-on-primary font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity tap-target disabled:opacity-60"
                  onClick={applyCoupon}
                  disabled={couponApplied()}
                >
                  {couponApplied() ? '✓ 已应用' : '应用'}
                </button>
              </div>
            </div>
            <OrderSummary />
            <div class="flex justify-around items-center px-4 py-2">
              {[
                { icon: 'verified_user', label: '安全支付' },
                { icon: 'local_shipping', label: '顺丰包邮' },
                { icon: 'support_agent', label: '在线客服' }
              ].map((item) => (
                <div class="flex flex-col items-center gap-1 group">
                  <span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">{item.icon}</span>
                  <span class="text-label-md text-outline group-hover:text-on-surface-variant">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile bottom checkout bar */}
      <div class="md:hidden fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-0 w-full bg-surface border-t border-outline-variant z-40 px-container-margin py-3">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-label-md text-on-surface-variant">合计</p>
            <p class="text-headline-lg-mobile font-bold text-primary">¥ {total().toFixed(2)}</p>
          </div>
          <button
            type="button"
            class="px-8 py-3 rounded-lg bg-primary text-on-primary font-bold active:scale-95 transition-transform tap-target disabled:opacity-60"
            onClick={checkout}
            disabled={checkoutState() !== 'idle'}
          >
            结算 ({itemCount()})
          </button>
        </div>
      </div>
    </main>
  )
}
