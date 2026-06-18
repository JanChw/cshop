import ProductImage from './ProductImage'

interface OrderItem {
  product: { name: string; image: string }
  quantity: number
  size: string
  color: string
}

interface Props {
  orderNumber: string
  status: 'pending' | 'shipping' | 'completed' | 'cancelled'
  items: OrderItem[]
  total: number
  designer?: string
  createdAt: string
}

const statusConfig = {
  pending: { label: '待付款', color: 'text-primary font-medium', actions: [{ text: '取消订单', primary: false }, { text: '去付款', primary: true }] },
  shipping: { label: '待收货', color: 'text-on-surface-variant', actions: [{ text: '查看物流', primary: false }, { text: '确认收货', primary: true }] },
  completed: { label: '已完成', color: 'text-outline', actions: [{ text: '查看详情', primary: false }, { text: '再次购买', primary: false }] },
  cancelled: { label: '已取消', color: 'text-outline', actions: [{ text: '查看详情', primary: false }] }
}

export default function OrderCard(props: Props) {
  const config = statusConfig[props.status]
  const item = props.items[0]

  return (
    <div class="bg-surface-container-low rounded-xl shadow-sm hover:shadow-elevated transition-shadow">
      <div class="flex items-center justify-between px-4 md:px-5 pt-4 md:pt-5 pb-2">
        <div class="flex items-center gap-2 min-w-0">
          <span class="material-symbols-outlined text-body-sm text-outline shrink-0">receipt_long</span>
          <span class="text-label-md text-on-surface-variant truncate">{props.orderNumber}</span>
          <span class="text-outline-variant text-label-md shrink-0">·</span>
          <span class="text-label-md text-on-surface-variant whitespace-nowrap shrink-0">{props.items.length}件</span>
        </div>
        <span class={`text-label-md shrink-0 ${config.color}`}>{config.label}</span>
      </div>

      <div class="flex gap-4 px-4 md:px-5 pb-3">
        <div class="w-20 h-24 md:w-24 md:h-28 bg-surface-container rounded-lg overflow-hidden flex-shrink-0">
          <ProductImage
            src={item?.product.image}
            alt={item?.product.name}
            aspect="aspect-[3/4]"
            rounded="rounded-lg"
            fallbackLabel={item?.product.name}
            class="w-full h-full object-cover"
          />
        </div>
        <div class="flex-1 min-w-0 flex flex-col md:flex-row md:justify-between md:gap-4">
          <div class="min-w-0">
            <h3 class="text-body-sm md:text-body-lg font-semibold text-on-surface truncate">{item?.product.name}</h3>
            <p class="text-label-md text-on-surface-variant mt-0.5">
              {item?.size} / {item?.color}
              {props.designer ? <span> · {props.designer}</span> : ''}
            </p>
          </div>
          <div class="mt-1 md:mt-0 md:text-right shrink-0">
            <p class="text-title-md md:text-xl font-bold text-on-surface">¥{props.total.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div class="px-4 md:px-5 pb-4 md:pb-5 flex justify-end gap-2">
        {config.actions.map((action) => (
          <button
            type="button"
            class={`px-4 py-1.5 rounded-lg text-label-md font-medium transition-all active:scale-95 tap-target ${
              action.primary
                ? 'bg-primary text-on-primary hover:opacity-90 shadow-sm'
                : 'border border-outline text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {action.text}
          </button>
        ))}
      </div>
    </div>
  )
}
