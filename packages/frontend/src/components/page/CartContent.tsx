import { createSignal, createMemo, createEffect, Show } from 'solid-js'
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
  const [removeTarget, setRemoveTarget] = createSignal<string | null>(null)

  let confirmRef: HTMLDivElement | undefined

  createEffect(() => {
    if (removeTarget()) {
      queueMicrotask(() => confirmRef?.focus())
    }
  })

  const trapConfirmFocus = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setRemoveTarget(null)
      return
    }
    if (e.key !== 'Tab' || !confirmRef) return
    const focusable = confirmRef.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const subtotal = createMemo(() => items().reduce((s, item) => s + item.price * item.qty, 0))
  const total = createMemo(() => Math.max(0, subtotal() - discount()))
  const itemCount = createMemo(() => items().reduce((s, item) => s + item.qty, 0))

  const updateQty = (id: string, qty: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, qty } : item)))
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    showToast('已移除')
    setRemoveTarget(null)
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

  const CouponSection = (p: { id: string }) => (
    <div class="bg-surface-container-lowest p-stack-md rounded-lg border border-outline-variant">
      <label class="block text-label-md text-on-surface-variant mb-2" for={p.id}>优惠券代码</label>
      <div class="flex flex-col gap-2">
        <input
          id={p.id}
          class="w-full bg-background border border-outline-variant rounded-lg px-4 py-2 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          placeholder="输入优惠码"
          value={couponInput()}
          onInput={(e) => setCouponInput(e.currentTarget.value)}
        />
        <button
          type="button"
          class="w-full bg-primary text-on-primary font-bold px-4 py-2 rounded-lg hover:opacity-90 hover:scale-[1.02] transition-opacity transition-transform duration-200 tap-target disabled:opacity-60"
          onClick={applyCoupon}
          disabled={couponApplied()}
        >
          {couponApplied() ? '✓ 已应用' : '应用'}
        </button>
      </div>
    </div>
  )

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
          <span class="text-accent font-bold">免运费</span>
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
        class="w-full mt-6 font-bold py-4 rounded-lg transition-opacity transition-transform hover:scale-[1.02] active:scale-95 duration-200 flex justify-center items-center gap-2 tap-target disabled:opacity-60"
        classList={{
          'bg-primary text-on-primary hover:opacity-90': checkoutState() !== 'done',
          'bg-success text-on-success': checkoutState() === 'done'
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
      <p class="text-center text-label-md text-on-surface-variant mt-4">支持 7 天无理由退换货</p>
    </div>
  )

  return (
    <main class="pt-12 md:pt-20 pb-[calc(140px+env(safe-area-inset-bottom))] md:pb-8 min-h-screen container-content relative">
      {/* Mobile header */}
      <header class="fixed top-0 left-0 w-full z-40 bg-surface border-b border-outline-variant md:hidden" style="padding-top: max(12px, env(safe-area-inset-top))">
        <div class="flex justify-between items-center px-container-margin h-12 w-full">
          <button
            type="button"
            onClick={() => history.back()}
            class="tap-target flex items-center justify-center text-primary"
            aria-label="返回"
          >
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 class="text-title-md font-bold text-on-surface">购物车</h1>
          <span class="text-label-md text-on-surface-variant">共 {itemCount()} 件商品</span>
        </div>
      </header>

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
            <div class="bg-surface-container-lowest p-stack-md rounded-lg border border-outline-variant flex gap-4 transition-shadow transition-transform hover:shadow-card hover:-translate-y-0.5">
              <div class="w-24 h-30 flex-shrink-0">
                <ProductImage src={item.image} alt={item.name} aspect="aspect-[4/5]" rounded="rounded-lg" fallbackLabel={item.name} />
              </div>
              <div class="flex-grow flex flex-col justify-between min-w-0">
                <div>
                  <div class="flex justify-between gap-2">
                    <h3 class="text-body-lg text-on-surface truncate">{item.name}</h3>
                    <button
                      type="button"
                      class="tap-target flex items-center justify-center text-red-500 hover:text-red-600 transition-colors shrink-0"
                      onClick={() => setRemoveTarget(item.id)}
                      aria-label="移除商品"
                    >
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                  <p class="text-body-sm text-on-surface-variant mt-1">{item.color} / {item.size}</p>
                  {item.designId && <p class="text-body-sm text-primary font-bold mt-1">设计ID: {item.designId}</p>}
                </div>
                <div class="flex justify-between items-end mt-4">
                  <QuantitySelector value={item.qty} min={1} onChange={(qty) => updateQty(item.id, qty)} />
                  <span class="text-title-md font-bold text-primary">¥ {(item.price * item.qty).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}

          <Show when={items().length > 0}>
            <div class="md:hidden">
              <CouponSection id="coupon-mobile" />
            </div>
          </Show>
        </section>

        <aside class="hidden md:block md:w-2/5">
          <div class="sticky top-20 space-y-stack-md">
            <CouponSection id="coupon-desktop" />
            <OrderSummary />
            <div class="flex justify-around items-center px-4 py-2 border border-outline-variant rounded-lg">
              {[
                { icon: 'verified_user', label: '安全支付' },
                { icon: 'local_shipping', label: '顺丰包邮' },
                { icon: 'support_agent', label: '在线客服' }
              ].map((svc) => (
                <div class="flex flex-col items-center gap-1 group">
                  <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">{svc.icon}</span>
                  <span class="text-label-md text-on-surface-variant">{svc.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile bottom checkout bar */}
      <div class="md:hidden fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-0 w-full bg-surface border-t border-outline-variant z-40 px-container-margin py-3">
        <div class="flex items-center justify-between gap-4">
          <Show when={checkoutState() !== 'done'} fallback={
            <div class="flex items-center gap-2 text-success font-bold">
              <span class="material-symbols-outlined">check_circle</span>
              <span>已提交</span>
            </div>
          }>
            <div>
              <p class="text-label-md text-on-surface-variant">合计</p>
              <p class="text-headline-lg-mobile font-bold text-primary">¥ {total().toFixed(2)}</p>
            </div>
          </Show>
          <button
            type="button"
            class="px-8 py-3 rounded-lg bg-primary text-on-primary font-bold hover:scale-[1.02] active:scale-95 transition-transform duration-200 tap-target disabled:opacity-60 flex items-center gap-2"
            onClick={checkout}
            disabled={checkoutState() !== 'idle'}
          >
            <Show when={checkoutState() === 'submitting'}>
              <span class="material-symbols-outlined animate-spin">progress_activity</span>
              <span>处理中...</span>
            </Show>
            <Show when={checkoutState() === 'done'}>
              <span class="material-symbols-outlined">check_circle</span>
              <span>已提交</span>
            </Show>
            <Show when={checkoutState() === 'idle'}>
              <span>结算 ({itemCount()})</span>
            </Show>
          </button>
        </div>
      </div>

      {/* Confirm dialog */}
      <Show when={removeTarget()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center p-8">
          <div class="absolute inset-0 bg-black/60" onClick={() => setRemoveTarget(null)} aria-hidden="true" />
          <div
            ref={confirmRef}
            role="alertdialog"
            aria-modal="true"
            aria-label="确认移除"
            tabIndex={-1}
            onKeyDown={trapConfirmFocus}
            class="relative w-72 md:max-w-xs bg-surface rounded-2xl shadow-elevated outline-none"
          >
            <div class="p-5">
              <h3 class="text-title-md font-bold text-on-surface text-center mb-2">移除商品</h3>
              <p class="text-body-sm text-on-surface-variant text-center mb-5">确定要移除此商品吗？</p>
              <div class="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => { const id = removeTarget(); if (id) removeItem(id) }}
                  class="w-full py-3 rounded-xl bg-error text-on-error font-bold tap-target active:scale-95 transition-all hover:opacity-90"
                >
                  移除
                </button>
                <button
                  type="button"
                  onClick={() => setRemoveTarget(null)}
                  class="w-full py-3 rounded-xl bg-surface-container-high text-on-surface font-bold tap-target active:scale-95 transition-all hover:bg-surface-container"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </main>
  )
}
