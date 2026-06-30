import { For, Show, createSignal, createMemo } from 'solid-js'

interface Props {
  productName: string
  totalPrice: number
  selectedSize: string
  quantity: number
  variantSizes: string[]
  addingCart: boolean
  onSizeChange: (size: string) => void
  onQuantityChange: (delta: number) => void
  onAddToCart: () => void
}

export default function CartBar(props: Props) {
  const [expanded, setExpanded] = createSignal(false)

  const fabClass = createMemo(() =>
    expanded()
      ? 'opacity-0 scale-0 pointer-events-none'
      : 'opacity-100 scale-100'
  )

  const panelClass = createMemo(() =>
    expanded()
      ? 'opacity-100 scale-100 pointer-events-auto'
      : 'opacity-0 scale-90 pointer-events-none'
  )

  return (
    <>
      {/* FAB */}
      <button
        class={`absolute z-40 transition-all duration-200 ease-out
               bottom-[calc(3.5rem+0.75rem)] right-4
               md:bottom-4 md:right-4
               w-12 h-12 rounded-full bg-primary text-on-primary shadow-elevated
               flex items-center justify-center
               hover:scale-105 active:scale-95 ${fabClass()}`}
        onClick={() => setExpanded(true)}
        aria-label="展开购物栏"
      >
        <span class="material-symbols-outlined">shopping_bag</span>
      </button>

      {/* Mobile: compact bar above tool dock */}
      <div
        class={`md:hidden absolute z-40 transition-all duration-200 ease-out
               bottom-[calc(3.5rem+0.75rem)] inset-x-4
               bg-surface/95 backdrop-blur-md rounded-xl border border-outline-variant shadow-elevated
               px-3 py-2 flex items-center gap-1 origin-bottom-right ${panelClass()}`}
      >
        <div class="min-w-0 shrink-0">
          <p class="text-base font-bold text-primary leading-tight">
            ¥{props.totalPrice.toFixed(2)}
          </p>
        </div>
        <div class="w-px h-8 bg-outline-variant shrink-0" />
        <select
          aria-label="尺码"
          value={props.selectedSize}
          onChange={(e) => props.onSizeChange(e.currentTarget.value)}
          class="h-8 pl-1.5 pr-5 rounded-lg bg-surface-container-high border border-outline-variant text-xs font-bold text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary shrink-0"
        >
          <For each={props.variantSizes}>
            {(s) => <option value={s}>{s}</option>}
          </For>
        </select>
        <div class="flex items-center gap-0.5 shrink-0">
          <button
            class="w-7 h-7 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => props.onQuantityChange(-1)}
            aria-label="减少数量"
          >
            <span class="material-symbols-outlined text-sm">remove</span>
          </button>
          <span class="w-5 text-center text-xs font-bold text-on-surface">{props.quantity}</span>
          <button
            class="w-7 h-7 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => props.onQuantityChange(1)}
            aria-label="增加数量"
          >
            <span class="material-symbols-outlined text-sm">add</span>
          </button>
        </div>
        <button
          class="ml-auto w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
          onClick={props.onAddToCart}
          disabled={props.addingCart}
          aria-label="加入购物车"
        >
          <span class="material-symbols-outlined text-sm">add_shopping_cart</span>
        </button>
        <button
          class="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
          onClick={() => setExpanded(false)}
          aria-label="收起购物栏"
        >
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      {/* Tablet: floating card at bottom-right */}
      <div
        class={`hidden md:flex md:absolute md:z-40 transition-all duration-200 ease-out
               md:right-4 md:bottom-4 md:w-64
               bg-surface/95 backdrop-blur-md rounded-2xl border border-outline-variant shadow-elevated p-4
               flex-col gap-3 origin-bottom-right ${panelClass()}`}
      >
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <p class="text-label-md text-on-surface-variant truncate">{props.productName}</p>
            <p class="text-xl font-bold text-primary leading-tight">
              ¥{props.totalPrice.toFixed(2)}
            </p>
          </div>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors shrink-0"
            onClick={() => setExpanded(false)}
            aria-label="收起购物栏"
          >
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        <div class="flex items-center gap-3">
          <select
            aria-label="尺码"
            value={props.selectedSize}
            onChange={(e) => props.onSizeChange(e.currentTarget.value)}
            class="h-9 pl-2 pr-6 rounded-lg bg-surface-container-high border border-outline-variant text-body-sm font-bold text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <For each={props.variantSizes}>
              {(s) => <option value={s}>{s}</option>}
            </For>
          </select>
          <div class="flex items-center gap-1">
            <button
              class="w-8 h-8 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => props.onQuantityChange(-1)}
              aria-label="减少数量"
            >
              <span class="material-symbols-outlined text-sm">remove</span>
            </button>
            <span class="w-5 text-center text-body-sm font-bold text-on-surface">{props.quantity}</span>
            <button
              class="w-8 h-8 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => props.onQuantityChange(1)}
              aria-label="增加数量"
            >
              <span class="material-symbols-outlined text-sm">add</span>
            </button>
          </div>
        </div>
        <button
          class="w-full h-9 rounded-lg bg-primary text-on-primary font-bold text-body-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          onClick={props.onAddToCart}
          disabled={props.addingCart}
        >
          加入购物车
        </button>
      </div>
    </>
  )
}
