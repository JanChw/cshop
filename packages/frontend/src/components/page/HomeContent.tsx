import { onMount, onCleanup } from 'solid-js'
import ProductCard from '../ui/ProductCard'
import ProductImage from '../ui/ProductImage'


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
    image: 'https://picsum.photos/seed/be82a4351710/400/500'
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

  return (
    <main class="pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0 md:pt-16">
      {/* Hero */}
      <section class="relative w-full min-h-[45vh] md:min-h-[280px] overflow-hidden">
        <div class="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-primary/8 blur-3xl md:hidden" />
        <div class="hidden md:block absolute bottom-0 left-[20%] w-80 h-80 rounded-full bg-primary/6 blur-3xl" />

        <div class="absolute inset-0 md:hidden bg-surface-container">
          <img
            class="w-full h-full object-cover"
            src="https://picsum.photos/seed/bychooow-hero/800/1000"
            alt="创作者服装工坊"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        <div class="hidden md:block absolute inset-0 bg-surface-container">
          <img
            class="w-full h-full object-cover object-center"
            src="https://picsum.photos/seed/bychooow-hero/1200/800"
            alt="创作者服装工坊"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        </div>

        <div class="relative container-content h-full flex flex-col justify-end md:justify-center pb-10 md:pb-0 md:min-h-[280px]">
          <div class="md:max-w-[45%]">
            <p class="text-label-md text-primary mb-3">创作者 · 连接 · 创作者</p>
            <h2 class="font-serif text-headline-lg-mobile md:text-headline-lg text-on-surface mb-5 md:mb-6 leading-[1.1] italic">
              将你的创意，<br class="md:hidden" />转化为高级成衣。
            </h2>
            <div class="flex flex-col sm:flex-row gap-stack-sm">
              <a
                href="/design"
                class="bg-primary text-on-primary px-8 py-3.5 rounded-lg font-bold text-center hover:opacity-90 transition-opacity active:scale-95 shadow-lg shadow-primary/20 tap-target flex items-center justify-center"
              >
                开始设计
              </a>
              <a
                href="/shop"
                class="bg-surface-container-lowest/90 backdrop-blur border border-outline-variant text-on-surface px-8 py-3.5 rounded-lg font-bold text-center hover:bg-surface-variant transition-colors active:scale-95 tap-target flex items-center justify-center"
              >
                探索
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 教学视频 */}
      <section class="mt-12 container-content">
        <div class="flex items-center gap-4 mb-stack-md">
          <div class="w-8 h-0.5 bg-primary rounded-full shrink-0" />
          <div>
            <h3 class="font-serif text-headline-lg-mobile text-on-surface">教学视频</h3>
            <p class="text-body-sm text-on-surface-variant mt-1">掌握设计技巧，开启创作之旅</p>
          </div>
        </div>
        <div class="flex flex-col md:grid md:grid-cols-2 gap-gutter">
          {VIDEOS.map((video, idx) => (
            <div class={`group cursor-pointer ${idx === 0 ? '' : 'md:mt-auto'}`}>
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
                  <div class="absolute w-16 h-16 rounded-full border-2 border-white/40 pulse-ring" />
                  <span class="material-symbols-outlined text-white text-5xl relative z-10">play_circle</span>
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
      <div class="container-content">
      <section class="mt-stack-lg bg-primary-container/30 -mx-container-margin px-container-margin md:mx-0 md:px-0 md:rounded-xl py-stack-lg">
        <div class="flex justify-between items-end mb-stack-md">
          <div>
            <h3 class="font-serif text-title-md text-on-surface">基础系列</h3>
            <p class="text-body-sm text-on-surface-variant/70 mt-1">专为二次创作优化的极简底衫</p>
          </div>
          <a href="/shop?category=Basics" class="text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all tap-target text-label-md">
            全部 <span class="material-symbols-outlined text-base">arrow_forward</span>
          </a>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-gutter">
          {props.basicProducts.map((p) => (
            <ProductCard product={p} variant="home" />
          ))}
        </div>
      </section>
      </div>

      {/* 必备单品 */}
      <section class="mt-16 container-content">
        <div class="flex items-center gap-4 mb-stack-md">
          <div class="w-8 h-0.5 bg-primary rounded-full shrink-0" />
          <h3 class="font-serif text-title-md text-on-surface">必备单品</h3>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-2 md:items-center gap-gutter">
          <a
            href={ESSENTIALS[0].href}
            class="relative rounded-lg overflow-hidden group col-span-2 md:col-span-1 md:row-span-2 aspect-[4/5]"
          >
            <ProductImage
              src={ESSENTIALS[0].image}
              alt={ESSENTIALS[0].title}
              aspect="aspect-square"
              rounded="rounded-lg"
              fallbackLabel={ESSENTIALS[0].title}
              class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6 md:p-8">
              <span class="inline-block bg-primary/90 backdrop-blur-sm text-white text-label-md px-3 py-1 rounded-full mb-3 shadow-sm w-fit">{ESSENTIALS[0].subtitle}</span>
              <h4 class="text-white font-serif text-headline-lg">{ESSENTIALS[0].title}</h4>
            </div>
          </a>
          {ESSENTIALS.slice(1).map((item) => (
            <a
              href={item.href}
              class="relative rounded-lg overflow-hidden group aspect-[3/4] md:aspect-auto"
            >
              <ProductImage
                src={item.image}
                alt={item.title}
                aspect="aspect-square"
                rounded="rounded-lg"
                fallbackLabel={item.title}
                class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              />
              <div class="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex flex-col justify-end p-4 md:p-6">
                <h4 class="text-white font-serif text-title-md">{item.title}</h4>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 联名工坊 */}
      <section class="mt-stack-lg mb-12 container-content">
        <div class="mb-stack-md">
          <h3 class="font-serif text-title-md text-on-surface">联名工坊</h3>
          <p class="text-body-sm text-on-surface-variant/70">来自顶级独立设计师的限定创意</p>
        </div>
        <div
          ref={(el) => { if (el) scrollContainers.push(el) }}
          class="flex md:grid md:grid-cols-3 overflow-x-auto hide-scrollbar gap-gutter snap-x"
        >
          {COLLABS.map((collab) => (
            <div class="flex-none w-[min(64vw,280px)] md:w-auto snap-start">
              <a href="/shop?category=Designer" class="block relative rounded-lg overflow-hidden group shadow-card">
                <div class="aspect-[3/4] overflow-hidden">
                  <span class="absolute top-3 right-3 bg-primary text-white text-label-md px-2.5 py-1 rounded-full shadow-sm z-10">限定</span>
                  <ProductImage
                    src={collab.image}
                    alt={collab.name}
                    aspect="aspect-[3/4]"
                    rounded="rounded-none"
                    fallbackLabel={collab.name}
                    class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex flex-col justify-end p-4">
                    <h5 class="text-white font-serif text-title-md">{collab.name}</h5>
                    <p class="text-label-md text-primary mt-1">{collab.series}</p>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
