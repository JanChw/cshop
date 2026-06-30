import ProductImage from './ProductImage'
import FavoriteButton from './FavoriteButton'
import { showToast } from '../../lib/toast'

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
  const aspect = props.aspect || 'aspect-[4/5]'

  const goToProduct = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button')) return
    window.location.href = `/product/${props.product.id}`
  }

  const handleQuickAdd = (e: MouseEvent) => {
    e.stopPropagation()
    showToast('已加入购物车')
  }

  const goDesign = (e: MouseEvent) => {
    e.stopPropagation()
    window.location.href = `/design?product=${props.product.id}`
  }

  return (
    <div class="group cursor-pointer block hover:-translate-y-1 transition-transform duration-200">
      <div onClick={goToProduct} class={`${aspect} rounded-lg bg-surface-container overflow-hidden mb-stack-sm relative`}>
        <ProductImage
          src={props.product.image}
          alt={props.product.name}
          aspect={aspect}
          rounded="rounded-lg"
          fallbackLabel={props.product.name}
          class="group-hover:opacity-60 transition-opacity duration-200"
        />
        {props.product.tags?.includes('New') && (
          <div class="absolute top-3 left-3 bg-accent-container text-on-accent-container text-label-md px-2 py-0.5 rounded-lg font-bold group-hover:scale-110 transition-transform duration-200">新品</div>
        )}
        {props.product.tags?.includes('Canvas Ready') && (
          <div class="absolute top-3 left-3 px-2.5 py-1 bg-surface rounded text-label-md text-primary border border-primary/20 group-hover:scale-110 transition-transform duration-200">可定制</div>
        )}
        {props.variant === 'home' && (
          <div onClick={goDesign} class="absolute inset-0 z-30 bg-inverse-surface/85 flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 md:scale-95 md:group-hover:scale-100 transition-all duration-300">
            <span class="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-bold pointer-events-none">开始定制</span>
          </div>
        )}
        {(props.variant === 'shop' || props.variant === 'search') && (
          <FavoriteButton productId={props.product.id} class="group-hover:scale-110 transition-transform duration-200" />
        )}
        {props.variant === 'search' && (
          <button
            type="button"
            onClick={handleQuickAdd}
            class="absolute bottom-3 right-3 w-11 h-11 bg-surface rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/20 group-hover:scale-110 transition-colors transition-transform duration-200 tap-target"
            aria-label="加入购物车"
          >
            <span class="material-symbols-outlined text-xl">add_shopping_cart</span>
          </button>
        )}
      </div>
      <div onClick={goToProduct} class="flex flex-col">
        <span class="text-label-md text-on-surface-variant">{props.product.category}</span>
        <h3 class="text-body-lg font-semibold text-on-surface truncate">{props.product.name}</h3>
        {props.variant === 'search' && <p class="text-on-surface-variant text-xs mb-2">{props.product.description || ''}</p>}
        <p class="text-title-md font-bold text-primary mt-1">¥{props.product.price}{props.product.originalPrice && <span class="text-body-sm text-accent line-through ml-2">¥{props.product.originalPrice}</span>}</p>
      </div>
    </div>
  )
}
