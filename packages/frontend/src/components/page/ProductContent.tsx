import { createSignal, createMemo } from 'solid-js'
import ProductImage from '../ui/ProductImage'
import { showToast } from '../../lib/toast'

const THUMBNAILS = [
  'https://picsum.photos/seed/374f813ba69b/400/500',
  'https://picsum.photos/seed/8d59cc3834da/400/500',
  'https://picsum.photos/seed/16843390e3cf/400/500'
]

const COLORS = ['白色', '黑色', '灰色']
const SIZES = ['S', 'M', 'L', 'XL', 'XXL']

export default function ProductContent() {
  const [mainImage, setMainImage] = createSignal(THUMBNAILS[0])
  const [selectedColor, setSelectedColor] = createSignal('白色')
  const [selectedSize, setSelectedSize] = createSignal('M')
  const [favorited, setFavorited] = createSignal(false)
  const [adding, setAdding] = createSignal(false)
  const [buying, setBuying] = createSignal(false)

  const price = 199
  const originalPrice = 299

  const handleThumbClick = (src: string) => {
    setMainImage(src)
  }

  const handleShare = () => {
    showToast('链接已复制到剪贴板')
  }

  const toggleFavorite = () => {
    setFavorited(!favorited())
    showToast(favorited() ? '已取消收藏' : '已加入收藏')
  }

  const handleAddToCart = () => {
    setAdding(true)
    setTimeout(() => {
      setAdding(false)
      showToast('商品已加入购物车')
    }, 600)
  }

  const handleBuyNow = () => {
    setBuying(true)
    setTimeout(() => {
      window.location.href = '/cart'
    }, 600)
  }

  const showSizeChart = () => {
    showToast('尺码表：S 胸围88/衣长62 · M 胸围92/衣长64 · L 胸围96/衣长66 · XL 胸围100/衣长68 · XXL 胸围104/衣长70')
  }

  return (
    <div class="md:pt-16 md:container-content">
      <div class="md:flex md:gap-8 md:py-8">
        {/* Left: images */}
        <div class="md:w-1/2 md:sticky md:top-20 md:self-start">
          <header class="md:hidden bg-surface border-b border-outline-variant fixed top-0 w-full z-50 h-14 flex justify-between items-center px-container-margin">
            <button
              type="button"
              onClick={() => history.back()}
              class="tap-target flex items-center justify-center text-on-surface hover:opacity-80 transition-opacity"
              aria-label="返回"
            >
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 class="text-title-md font-bold text-on-surface">ByChooow</h1>
            <button
              type="button"
              onClick={handleShare}
              class="tap-target flex items-center justify-center text-on-surface hover:opacity-80 transition-opacity"
              aria-label="分享"
            >
              <span class="material-symbols-outlined">share</span>
            </button>
          </header>

          <section class="relative bg-white md:rounded-2xl md:overflow-hidden md:border md:border-outline-variant/30 pt-14 md:pt-0">
            <div class="aspect-[4/5] overflow-hidden">
              <ProductImage
                src={mainImage()}
                alt="定制创意印花 T恤"
                aspect="aspect-[4/5]"
                rounded="rounded-none"
                fallbackLabel="定制创意印花 T恤"
                eager
              />
            </div>
            <div class="flex gap-stack-sm p-container-margin overflow-x-auto hide-scrollbar">
              {THUMBNAILS.map((src) => (
                <button
                  type="button"
                  onClick={() => handleThumbClick(src)}
                  class={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 tap-target ${mainImage() === src ? 'border-2 border-primary' : 'border-2 border-transparent hover:border-outline-variant'}`}
                  aria-label="切换主图"
                  aria-pressed={mainImage() === src}
                >
                  <ProductImage src={src} alt="" aspect="aspect-square" rounded="rounded-lg" fallbackLabel="" />
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right: info */}
        <div class="md:w-1/2 pb-32 md:pb-0">
          <section class="px-container-margin md:px-0 mb-stack-md">
            <div class="flex justify-between items-start mb-unit">
              <span class="bg-primary-container text-primary text-label-md px-2 py-1 rounded">可定制</span>
            </div>
            <h2 class="text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">定制创意印花 T恤</h2>
            <div class="flex items-baseline gap-2 mb-stack-md">
              <span class="text-primary font-bold text-2xl">¥ {price.toFixed(2)}</span>
              <span class="text-outline text-body-sm line-through">¥ {originalPrice.toFixed(2)}</span>
            </div>
            <p class="text-on-surface-variant text-body-sm leading-relaxed">
              采用 100% 高品质精梳棉，手感柔软亲肤。支持多区域个性化定制，让你的创意灵感跃然衣上。
            </p>
          </section>

          <a href="/design"
            class="block mx-container-margin md:mx-0 mb-stack-lg p-stack-md bg-surface-container-low rounded-lg border border-outline-variant cursor-pointer hover:border-primary transition-colors">
            <div class="flex items-center gap-stack-md">
              <div class="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-on-primary shrink-0">
                <span class="material-symbols-outlined">rebase_edit</span>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="text-body-lg font-bold text-on-surface">开始您的创作</h4>
                <p class="text-body-sm text-on-surface-variant">点击前往设计画布，添加属于你的印花</p>
              </div>
              <span class="material-symbols-outlined text-outline">chevron_right</span>
            </div>
          </a>

          <section class="px-container-margin md:px-0 mb-stack-lg">
            <div class="mb-stack-lg">
              <h5 class="text-label-md text-on-surface mb-stack-sm">颜色选择</h5>
              <div class="flex gap-stack-sm flex-wrap">
                {COLORS.map((color) => (
                  <button
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    class={`px-4 py-2 rounded-lg text-body-sm tap-target transition-all ${
                      selectedColor() === color
                        ? 'border-2 border-primary text-on-surface bg-white'
                        : 'border border-outline-variant text-on-surface hover:bg-surface-container'
                    }`}
                    aria-pressed={selectedColor() === color}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div class="flex justify-between items-center mb-stack-sm">
                <h5 class="text-label-md text-on-surface">尺码选择</h5>
                <button
                  type="button"
                  onClick={showSizeChart}
                  class="text-primary text-label-md flex items-center gap-1 tap-target"
                >
                  <span class="material-symbols-outlined text-sm">straighten</span>尺码表
                </button>
              </div>
              <div class="grid grid-cols-5 gap-stack-sm">
                {SIZES.map((size) => (
                  <button
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    class={`py-2 rounded-lg text-center text-body-sm tap-target transition-all ${
                      selectedSize() === size
                        ? 'border-2 border-primary bg-white text-on-surface'
                        : 'border border-outline-variant text-on-surface hover:bg-surface-container'
                    }`}
                    aria-pressed={selectedSize() === size}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section class="mx-container-margin md:mx-0 p-stack-md bg-surface-container-lowest rounded-lg border border-outline-variant mb-stack-lg space-y-4">
            <div class="flex items-start gap-stack-md">
              <span class="material-symbols-outlined text-primary">local_shipping</span>
              <div>
                <p class="font-bold text-on-surface">免费配送</p>
                <p class="text-body-sm text-on-surface-variant">所有定制订单均享顺丰包邮服务</p>
              </div>
            </div>
            <div class="flex items-start gap-stack-md">
              <span class="material-symbols-outlined text-primary">verified_user</span>
              <div>
                <p class="font-bold text-on-surface">售后保障</p>
                <p class="text-body-sm text-on-surface-variant">支持 7 天无理由退换（定制印花除外）</p>
              </div>
            </div>
          </section>

          <section class="px-container-margin md:px-0 mb-stack-lg">
            <div class="border-t border-outline-variant pt-stack-lg">
              <h5 class="text-title-md mb-stack-md text-on-surface">商品详情</h5>
              <div class="space-y-stack-md text-body-sm text-on-surface-variant">
                <div class="flex justify-between border-b border-outline-variant pb-2">
                  <span>材质</span><span class="text-on-surface font-semibold">100% 精梳棉</span>
                </div>
                <div class="flex justify-between border-b border-outline-variant pb-2">
                  <span>克重</span><span class="text-on-surface font-semibold">220g 重磅</span>
                </div>
                <div class="flex justify-between border-b border-outline-variant pb-2">
                  <span>版型</span><span class="text-on-surface font-semibold">宽松落肩</span>
                </div>
              </div>
              <div class="mt-stack-lg p-stack-md bg-surface-container-low rounded-lg">
                <h6 class="font-bold text-on-surface mb-2">设计师寄语</h6>
                <p class="text-body-sm leading-relaxed italic text-on-surface-variant">
                  "这不仅是一件 T恤，更是你表达自我的画布。我们致力于提供最高品质的基础款，让你的每一个设计都能完美呈现。"
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom action bar */}
      <div class="md:hidden fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-0 w-full bg-white border-t border-outline-variant z-40">
        <div class="flex items-center gap-stack-md px-container-margin py-stack-md pb-[max(12px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => showToast('正在连接在线客服...')}
            class="flex flex-col items-center justify-center text-secondary px-2 tap-target"
            aria-label="咨询客服"
          >
            <span class="material-symbols-outlined">chat_bubble</span>
            <span class="text-label-md">咨询</span>
          </button>
          <button
            type="button"
            onClick={toggleFavorite}
            class={`flex flex-col items-center justify-center px-2 tap-target ${favorited() ? 'text-error' : 'text-secondary'}`}
            aria-label={favorited() ? '取消收藏' : '加入收藏'}
            aria-pressed={favorited()}
          >
            <span
              class="material-symbols-outlined"
              style={`font-variation-settings: 'FILL' ${favorited() ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`}
            >
              favorite
            </span>
            <span class="text-label-md">收藏</span>
          </button>
          <div class="flex-1 flex gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding()}
              class="flex-1 py-3 rounded-lg border border-primary font-bold text-primary text-body-lg active:scale-95 transition-transform bg-white tap-target disabled:opacity-60"
            >
              {adding() ? '已加入' : '加入购物车'}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={buying()}
              class="flex-1 py-3 rounded-lg bg-primary font-bold text-on-primary text-body-lg active:scale-95 transition-transform tap-target disabled:opacity-60"
            >
              {buying() ? '跳转中...' : '立即购买'}
            </button>
          </div>
        </div>
      </div>

      {/* Tablet action bar */}
      <div class="hidden md:flex fixed bottom-0 left-0 w-full bg-surface border-t border-outline-variant z-40 px-container-margin py-4 justify-end gap-4">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={adding()}
          class="px-8 py-3 rounded-lg border border-primary font-bold text-primary bg-white hover:bg-primary-container transition-colors tap-target disabled:opacity-60"
        >
          {adding() ? '已加入' : '加入购物车'}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={buying()}
          class="px-8 py-3 rounded-lg bg-primary font-bold text-on-primary hover:opacity-90 transition-opacity tap-target disabled:opacity-60"
        >
          {buying() ? '跳转中...' : '立即购买'}
        </button>
      </div>
    </div>
  )
}
