import { createSignal, onMount, onCleanup } from 'solid-js'
import ProductCard from '../ui/ProductCard'
import ProductImage from '../ui/ProductImage'
import { showToast } from '../../lib/toast'

interface Product {
  id: string
  name: string
  price: number
  image: string
  category: string
  tags?: string[]
}

interface Props {
  basicProducts: Product[]
}

const VIDEOS = [
  {
    title: 'DIY 服装设计入门',
    image: 'https://picsum.photos/seed/7f8cf89efb0e/400/500',
    duration: '12:35'
  },
  {
    title: '手绘模式进阶指南',
    image: 'https://picsum.photos/seed/529e783db21a/400/500',
    duration: '18:42'
  }
]

const ESSENTIALS = [
  {
    title: '全季胶囊衣橱',
    subtitle: 'Editor\'s Choice',
    href: '/shop?category=Essentials',
    image: 'https://picsum.photos/seed/be82a4351710/400/500',
    span: true
  },
  {
    title: '创意配饰',
    href: '/shop?category=Essentials',
    image: 'https://picsum.photos/seed/5b544b58712c/400/500'
  },
  {
    title: '色彩灵感',
    href: '/shop?category=Essentials',
    image: 'https://picsum.photos/seed/3b1bd334209c/400/500'
  }
]

const COLLABS = [
  {
    name: 'Alex Chen x ByChooow',
    series: '未来主义系列',
    image: 'https://picsum.photos/seed/bd70f38efcad/400/500'
  },
  {
    name: 'Li Wei x ByChooow',
    series: '极简几何',
    image: 'https://picsum.photos/seed/0e8e0ccdb74e/400/500'
  },
  {
    name: 'Studio Z x ByChooow',
    series: '光影实验',
    image: 'https://picsum.photos/seed/0430d3c9e90f/400/500'
  }
]

export default function HomeContent(props: Props) {
  const [fabRotated, setFabRotated] = createSignal(false)
  let scrollContainers: HTMLElement[] = []

  onMount(() => {
    const handler = (evt: WheelEvent) => {
      const target = evt.currentTarget as HTMLElement
      if (target.scrollWidth > target.clientWidth) {
        evt.preventDefault()
        target.scrollLeft += evt.deltaY
      }
    }
    scrollContainers.forEach((el) => el.addEventListener('wheel', handler))
    onCleanup(() => {
      scrollContainers.forEach((el) => el.removeEventListener('wheel', handler))
    })
  })

  const handleFabClick = () => {
    setFabRotated(true)
    showToast('开始新的创作')
    setTimeout(() => setFabRotated(false), 1000)
  }

  return (
    <main class="pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0 md:pt-16">
      {/* Hero */}
      <section class="relative w-full min-h-[60vh] md:min-h-[360px] overflow-hidden">
        <div class="absolute inset-0 md:hidden bg-surface-container">
          <img
            class="w-full h-full object-cover"
            src="https://picsum.photos/seed/bychooow-hero/800/1000"
            alt="创作者服装工坊"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>

        <div class="hidden md:block absolute inset-0 bg-surface-container">
          <img
            class="w-full h-full object-cover object-center"
            src="https://picsum.photos/seed/bychooow-hero/1200/800"
            alt="创作者服装工坊"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        </div>

        <div class="relative container-content h-full flex flex-col justify-end md:justify-center pb-12 md:pb-0 md:min-h-[360px]">
          <div class="md:max-w-[45%]">
            <p class="text-label-md text-primary mb-4">创作者 · 连接 · 创作者</p>
            <h2 class="font-serif text-headline-lg-mobile md:text-headline-lg text-on-surface mb-6 md:mb-8 leading-[1.1] italic">
              将你的创意，<br class="md:hidden" />转化为高级成衣。
            </h2>
            <div class="flex flex-col sm:flex-row gap-stack-md">
              <a
                href="/design"
                class="bg-primary text-on-primary px-8 py-4 rounded-lg font-bold text-center hover:opacity-90 transition-opacity active:scale-95 shadow-lg shadow-primary/20 tap-target flex items-center justify-center"
              >
                开始设计
              </a>
              <a
                href="/shop"
                class="bg-surface-container-lowest/90 backdrop-blur border border-outline-variant text-on-surface px-8 py-4 rounded-lg font-bold text-center hover:bg-surface-variant transition-colors active:scale-95 tap-target flex items-center justify-center"
              >
                探索
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 教学视频 */}
      <section class="mt-stack-lg container-content">
        <div class="flex justify-between items-end mb-stack-md">
          <div>
            <h3 class="font-serif text-headline-lg-mobile text-on-surface">教学视频</h3>
            <p class="text-body-sm text-on-surface-variant mt-1">掌握设计技巧，开启创作之旅</p>
          </div>
        </div>
        <div
          ref={(el) => { if (el) scrollContainers.push(el) }}
          class="flex md:grid md:grid-cols-3 overflow-x-auto hide-scrollbar gap-gutter snap-x"
        >
          {VIDEOS.map((video) => (
            <div class="flex-none w-[min(72vw,320px)] md:w-auto snap-start group cursor-pointer">
              <div class="aspect-video bg-surface-container-low rounded-lg overflow-hidden mb-stack-sm relative">
                <ProductImage
                  src={video.image}
                  alt={video.title}
                  aspect="aspect-video"
                  rounded="rounded-lg"
                  fallbackLabel={video.title}
                  class="group-hover:scale-105 transition-transform duration-700"
                />
                <div class="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                  <span class="material-symbols-outlined text-white text-5xl">play_circle</span>
                </div>
                <span class="absolute bottom-2 right-2 bg-black/60 text-white text-label-md px-2 py-0.5 rounded">
                  {video.duration}
                </span>
              </div>
              <h4 class="text-body-lg text-on-surface">{video.title}</h4>
              <p class="text-label-md text-primary mt-1">立即观看</p>
            </div>
          ))}
        </div>
      </section>

      {/* 基础系列 */}
      <section class="mt-stack-lg container-content">
        <div class="flex justify-between items-end mb-stack-md">
          <div>
            <h3 class="font-serif text-headline-lg-mobile text-on-surface">基础系列</h3>
            <p class="text-body-sm text-on-surface-variant mt-1">专为二次创作优化的极简底衫</p>
          </div>
          <a href="/shop?category=Basics" class="text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all tap-target">
            全部 <span class="material-symbols-outlined text-lg">arrow_forward</span>
          </a>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-gutter">
          {props.basicProducts.map((p) => (
            <ProductCard product={p} variant="home" />
          ))}
        </div>
      </section>

      {/* 必备单品 */}
      <section class="mt-stack-lg container-content">
        <h3 class="font-serif text-headline-lg-mobile text-on-surface mb-stack-md">必备单品</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {ESSENTIALS.map((item) => (
            <a
              href={item.href}
              class={`relative rounded-lg overflow-hidden group aspect-[4/5] md:aspect-auto ${item.span ? 'md:col-span-1 md:row-span-2' : ''}`}
            >
              <ProductImage
                src={item.image}
                alt={item.title}
                aspect="aspect-square"
                rounded="rounded-lg"
                fallbackLabel={item.title}
                class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              />
              <div class={`absolute inset-0 flex flex-col justify-end p-6 md:p-8 ${item.subtitle ? 'bg-gradient-to-t from-black/60 via-transparent to-transparent' : 'bg-black/30 group-hover:bg-black/20 transition-colors'}`}>
                {item.subtitle && (
                  <span class="text-white/90 text-label-md mb-2">{item.subtitle}</span>
                )}
                <h4 class={`text-white font-serif ${item.subtitle ? 'text-headline-lg' : 'text-title-md'}`}>
                  {item.title}
                </h4>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 联名工坊 */}
      <section class="mt-stack-lg mb-stack-lg container-content">
        <div class="mb-stack-md">
          <h3 class="font-serif text-headline-lg-mobile text-on-surface">联名工坊</h3>
          <p class="text-body-sm text-on-surface-variant">来自顶级独立设计师的限定创意</p>
        </div>
        <div
          ref={(el) => { if (el) scrollContainers.push(el) }}
          class="flex md:grid md:grid-cols-3 overflow-x-auto hide-scrollbar gap-gutter snap-x"
        >
          {COLLABS.map((collab) => (
            <div class="flex-none w-[min(64vw,280px)] md:w-auto snap-start">
              <a href="/shop?category=Designer" class="aspect-square rounded-full overflow-hidden mb-6 border-8 border-surface-container-high shadow-lg group block">
                <ProductImage
                  src={collab.image}
                  alt={collab.name}
                  aspect="aspect-square"
                  rounded="rounded-full"
                  fallbackLabel={collab.name}
                  class="group-hover:scale-110 transition-transform duration-700"
                />
              </a>
              <div class="text-center">
                <h5 class="font-serif text-title-md text-on-surface">{collab.name}</h5>
                <p class="text-label-md text-primary mt-2">{collab.series}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Action Button */}
      <button
        onClick={handleFabClick}
        class={`fixed bottom-24 md:bottom-8 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-110 active:scale-95 transition-transform tap-target ${fabRotated() ? 'rotate-45' : ''}`}
        aria-label="开始新的创作"
      >
        <span class="material-symbols-outlined text-3xl">add</span>
      </button>
    </main>
  )
}
