import { createSignal } from 'solid-js'
import FavoriteButton from './FavoriteButton'

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  category: string
  categoryEn?: string
  tags?: string[]
  description?: string
}

interface Props {
  product: Product
  variant?: 'shop' | 'home' | 'search'
  aspect?: string
}

export default function ProductCard(props: Props) {
  const [favorited, setFavorited] = createSignal(false)
  const aspect = props.aspect || (props.variant === 'shop' ? 'aspect-[4/5]' : 'aspect-[3/4]')

  return (
    <a href={`/product/${props.product.id}`} class="group cursor-pointer block">
      <div class={`${aspect} rounded-lg bg-surface-container overflow-hidden mb-stack-sm relative border border-outline-variant/20`}>
        <img
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={props.product.image}
          alt={props.product.name}
          loading="lazy"
        />
        {props.product.tags?.includes('New') && (
          <div class="absolute top-3 left-3 bg-primary text-on-primary text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider">New</div>
        )}
        {props.product.tags?.includes('Canvas Ready') && (
          <div class="absolute top-4 left-4 px-2.5 py-1 bg-surface/90 backdrop-blur rounded text-label-md text-[10px] uppercase tracking-wider text-primary border border-primary/20">Canvas Ready</div>
        )}
        {props.variant === 'home' && (
          <div class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <a href="/design" onclick="event.stopPropagation()" class="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-bold hover:scale-105 transition-transform shadow-lg">开始定制</a>
          </div>
        )}
        {(props.variant === 'shop' || props.variant === 'search') && (
          <FavoriteButton active={favorited()} onToggle={setFavorited} />
        )}
        {props.variant === 'search' && (
          <div class="absolute bottom-3 right-3 w-10 h-10 bg-surface/80 backdrop-blur rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); showToast('已加入购物车') }}>
            <span class="material-symbols-outlined text-xl">add_shopping_cart</span>
          </div>
        )}
      </div>
      <div class="flex flex-col">
        <span class="text-label-md text-on-surface-variant">{props.product.category}</span>
        <h3 class="text-body-lg font-semibold text-on-surface truncate">{props.product.name}</h3>
        {props.variant === 'search' && <p class="text-on-surface-variant text-xs mb-2">{props.product.description || ''}</p>}
        <p class="text-title-md font-bold text-primary mt-1">¥{props.product.price}</p>
      </div>
    </a>
  )
}

function showToast(msg: string) {
  const t = document.createElement('div')
  t.textContent = msg
  t.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 24px;border-radius:8px;z-index:999;font-size:14px;opacity:0;transition:opacity 0.3s'
  document.body.appendChild(t)
  requestAnimationFrame(() => t.style.opacity = '1')
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300) }, 2000)
}
