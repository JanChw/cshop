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
  pending: { label: '待付款', color: 'text-primary font-bold', actions: [{ text: '取消订单', primary: false }, { text: '去付款', primary: true }] },
  shipping: { label: '待收货', color: 'text-on-surface-variant', actions: [{ text: '查看物流', primary: false }, { text: '确认收货', primary: true }] },
  completed: { label: '已完成', color: 'text-outline', actions: [{ text: '查看详情', primary: false }, { text: '再次购买', primary: false }] },
  cancelled: { label: '已取消', color: 'text-outline', actions: [{ text: '查看详情', primary: false }] }
}

export default function OrderCard(props: Props) {
  const config = statusConfig[props.status]
  const item = props.items[0]

  return (
    <div class="bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden shadow-sm hover:shadow-elevated transition-shadow">
      <div class="px-4 py-3 flex justify-between items-center border-b border-outline-variant bg-surface-container-low">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-body-sm text-outline">receipt_long</span>
          <span class="text-label-md text-on-surface-variant">订单号: {props.orderNumber}</span>
        </div>
        <span class={`text-label-md ${config.color}`}>{config.label}</span>
      </div>
      <div class="p-4 flex gap-4 md:items-center">
        <div class="w-24 h-32 md:w-28 md:h-36 bg-surface-container rounded-lg overflow-hidden flex-shrink-0">
          <ProductImage
            src={item?.product.image}
            alt={item?.product.name}
            aspect="aspect-[3/4]"
            rounded="rounded-lg"
            fallbackLabel={item?.product.name}
            class="transition-transform duration-500 hover:scale-105"
          />
        </div>
        <div class="flex-grow flex flex-col md:flex-row md:justify-between md:gap-6 min-w-0">
          <div class="flex-1 min-w-0">
            <h3 class="text-title-md text-on-surface mb-1 truncate">{item?.product.name}</h3>
            <p class="text-body-sm text-on-surface-variant">尺码: {item?.size} / 颜色: {item?.color}</p>
            {props.designer && <p class="text-label-md text-outline mt-2">设计者: {props.designer}</p>}
          </div>
          <div class="md:text-right mt-2 md:mt-0">
            <p class="text-body-sm text-on-surface-variant">共 {props.items.length} 件</p>
            <p class="text-label-md text-outline mt-1">合计:</p>
            <p class="text-title-md text-on-surface font-bold">¥{props.total.toFixed(2)}</p>
          </div>
        </div>
      </div>
      <div class="px-4 py-4 flex justify-end gap-3 border-t border-outline-variant">
        {config.actions.map((action) => (
          <button
            type="button"
            class={`px-6 py-2 rounded-lg text-label-md transition-all active:scale-95 tap-target ${
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
