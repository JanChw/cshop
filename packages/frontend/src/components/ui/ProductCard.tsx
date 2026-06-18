import { createSignal } from 'solid-js'
import FavoriteButton from './FavoriteButton'
import ProductImage from './ProductImage'
import { showToast } from '../../lib/toast'

const goDesign = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  window.location.href = '/design'
}

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
  const aspect = props.aspect || 'aspect-[4/5]'

  const handleQuickAdd = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    showToast('已加入购物车')
  }

  return (
    <a href={`/product/${props.product.id}`} class="group cursor-pointer block">
      <div class={`${aspect} rounded-lg bg-surface-container overflow-hidden mb-stack-sm relative border border-outline-variant/20`}>
        <ProductImage
          src={props.product.image}
          alt={props.product.name}
          aspect={aspect}
          rounded="rounded-lg"
          fallbackLabel={props.product.name}
          class="group-hover:scale-105 transition-transform duration-500"
        />
        {props.product.tags?.includes('New') && (
          <div class="absolute top-3 left-3 bg-primary text-on-primary text-label-md px-2 py-0.5 rounded-lg font-medium">新品</div>
        )}
        {props.product.tags?.includes('Canvas Ready') && (
          <div class="absolute top-3 left-3 px-2.5 py-1 bg-surface/90 backdrop-blur rounded text-label-md text-primary border border-primary/20">可定制</div>
        )}
        {props.variant === 'home' && (
          <div class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={goDesign}
              class="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-bold hover:scale-105 transition-transform shadow-lg tap-target"
            >
              开始定制
            </button>
          </div>
        )}
        {(props.variant === 'shop' || props.variant === 'search') && (
          <FavoriteButton active={favorited()} onToggle={setFavorited} />
        )}
        {props.variant === 'search' && (
          <button
            type="button"
            onClick={handleQuickAdd}
            class="absolute bottom-3 right-3 w-11 h-11 bg-surface/80 backdrop-blur rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors tap-target"
            aria-label="加入购物车"
          >
            <span class="material-symbols-outlined text-xl">add_shopping_cart</span>
          </button>
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
