import { createResource, For, Show, onMount } from 'solid-js'
import ProductCard from '../ui/ProductCard'
import ProductImage from '../ui/ProductImage'
import ScrollRow from '../ui/ScrollRow'
import { api, type HomeSection } from '../../lib/api'

interface ProductData {
  id: number; name: string; basePrice: number; images: string[]; categoryId: number | null
}

type SectionRendererProps = {
  section: HomeSection
  products: Record<number, ProductData>
}

function HeroSection(props: SectionRendererProps) {
  const data = () => props.section.data
  const images = data()?.images || []
  const mobileImg = () => images.find((im: any) => im.device === 'mobile')?.url
  const tabletImg = () => images.find((im: any) => im.device === 'tablet')?.url

  return (
    <section class="relative w-full min-h-[45vh] md:min-h-[320px] overflow-hidden">
      <div class="absolute inset-0 md:hidden bg-surface-container">
        <img class="w-full h-full object-cover opacity-80" src={mobileImg()} alt="" />
        <div class="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>
      <div class="hidden md:block absolute inset-0 bg-surface-container">
        <img class="w-full h-full object-cover object-center opacity-70" src={tabletImg()} alt="" />
        <div class="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      </div>
      <div class="relative container-content h-full flex flex-col justify-end md:justify-center pb-10 md:pb-0 md:min-h-[320px]">
        <div class="md:max-w-[45%]">
          <p class="text-label-md text-accent font-medium mb-3">{props.section.title}</p>
          <h1 class="font-headline text-headline-lg-mobile md:text-headline-lg text-on-surface mb-5 md:mb-6 leading-[1.1]">{props.section.subTitle}</h1>
          <div class="flex flex-col sm:flex-row gap-stack-sm">
            <a href="/design" class="bg-primary text-on-primary px-8 py-3.5 rounded-lg font-bold text-center hover:scale-[1.03] transition-transform duration-300 tap-target flex items-center justify-center">开始设计</a>
            <a href="/shop" class="bg-surface-container-high border border-outline-variant text-on-surface px-8 py-3.5 rounded-lg font-bold text-center hover:bg-surface-variant hover:scale-[1.03] transition-colors transition-transform duration-300 tap-target flex items-center justify-center">探索商店</a>
          </div>
        </div>
      </div>
    </section>
  )
}

function VideosSection(props: SectionRendererProps) {
  const videos = () => props.section.data?.videos || []

  return (
    <section class="mt-16 container-content">
      <div class="mb-stack-md">
        <p class="text-label-md text-on-surface-variant font-semibold mb-1">{props.section.title}</p>
        <h2 class="font-headline text-title-md text-on-surface">{props.section.subTitle}</h2>
      </div>
      <div class="flex flex-col md:grid md:grid-cols-2 gap-gutter">
        <For each={videos()}>
          {(video: any, idx) => (
            <div class={`group cursor-pointer ${idx() === 0 ? '' : 'md:mt-auto'}`}>
              <div class="aspect-video bg-surface-container-low rounded-lg overflow-hidden mb-stack-sm relative">
                <ProductImage src={video.image} alt={video.title} aspect="aspect-video" rounded="rounded-lg" fallbackLabel={video.title} class="group-hover:opacity-75 transition-opacity duration-200" />
                <div class="absolute inset-0 flex items-center justify-center bg-black/60 group-hover:bg-black/80 transition-colors duration-300">
                  <span class="material-symbols-outlined text-white text-5xl relative z-10 group-hover:scale-110 transition-transform duration-200">play_circle</span>
                </div>
                <span class="absolute bottom-2 right-2 bg-black/60 text-white text-label-md px-2 py-0.5 rounded">{video.duration}</span>
              </div>
              <h3 class="text-body-lg text-on-surface">{video.title}</h3>
              <p class="text-label-md text-primary mt-1">立即观看</p>
            </div>
          )}
        </For>
      </div>
    </section>
  )
}

function ProductRowSection(props: SectionRendererProps) {
  const contents = () => props.section.data?.contents || []

  return (
    <div class="container-content">
      <section class="mt-stack-lg bg-surface-container-low -mx-container-margin px-container-margin md:mx-0 md:px-0 md:rounded-xl py-stack-lg">
        <div class="flex justify-between items-end mb-stack-md">
          <div>
            <p class="text-label-md text-on-surface-variant font-semibold mb-1">{props.section.title}</p>
            <Show when={props.section.subTitle}>
              <h2 class="font-headline text-title-md text-on-surface">{props.section.subTitle}</h2>
            </Show>
          </div>
          <a href="/shop" class="text-on-surface-variant font-medium flex items-center gap-1 hover:text-primary transition-colors tap-target text-label-md">
            全部 <span class="material-symbols-outlined text-base text-on-surface-variant">arrow_forward</span>
          </a>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-gutter">
          <For each={contents()}>
            {(item: any) => {
              const product = props.products[item.productId]
              if (!product) return null
              return (
                <ProductCard product={{
                  id: String(product.id),
                  name: product.name,
                  price: product.basePrice,
                  image: item.cover || product.images?.[0] || '',
                  category: ''
                }} variant="home" />
              )
            }}
          </For>
        </div>
      </section>
    </div>
  )
}

function CardGridSection(props: SectionRendererProps) {
  const contents = () => props.section.data?.contents || []
  const first = () => contents()[0]
  const rest = () => contents().slice(1)

  return (
    <section class="mt-16 container-content">
      <div class="mb-stack-md">
        <p class="text-label-md text-on-surface-variant font-semibold mb-1">{props.section.title}</p>
        <Show when={props.section.subTitle}>
          <h2 class="font-headline text-title-md text-on-surface">{props.section.subTitle}</h2>
        </Show>
      </div>
      <Show when={first()}>
        <div class="grid grid-cols-2 md:grid-cols-2 md:items-center gap-gutter">
          <a href={first().productId ? `/products/${first().productId}` : '/shop'} class="relative rounded-lg overflow-hidden group col-span-2 md:col-span-1 md:row-span-2 aspect-[4/5]">
            <ProductImage src={first().cover} alt={first().title || ''} aspect="aspect-square" rounded="rounded-lg" fallbackLabel={first().title} class="absolute inset-0 w-full h-full object-cover group-hover:opacity-75 transition-opacity duration-200" />
            <div class="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-transparent flex flex-col justify-end p-6 md:p-8">
              <Show when={first().subtitle}>
                <span class="inline-block bg-primary/90 backdrop-blur-sm text-on-primary text-label-md px-3 py-1 rounded-full mb-3 w-fit group-hover:scale-110 transition-transform duration-200">{first().subtitle}</span>
              </Show>
              <h3 class="text-on-surface font-headline text-headline-lg group-hover:translate-y-[-2px] transition-transform duration-200 text-shadow-overlay">{first().title}</h3>
            </div>
          </a>
          <For each={rest()}>
            {(item: any) => (
              <a href={item.productId ? `/products/${item.productId}` : '/shop'} class="relative rounded-lg overflow-hidden group aspect-[3/4] md:aspect-auto">
                <ProductImage src={item.cover} alt={item.title || ''} aspect="aspect-square" rounded="rounded-lg" fallbackLabel={item.title} class="absolute inset-0 w-full h-full object-cover group-hover:opacity-75 transition-opacity duration-200" />
                <div class="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent flex flex-col justify-end p-4 md:p-6">
                  <h3 class="text-on-surface font-headline text-title-md group-hover:translate-y-[-2px] transition-transform duration-200 text-shadow-overlay">{item.title}</h3>
                </div>
              </a>
            )}
          </For>
        </div>
      </Show>
    </section>
  )
}

function DesignerGridSection(props: SectionRendererProps) {
  const contents = () => props.section.data?.contents || []

  return (
    <section class="mt-stack-lg mb-12 container-content">
      <div class="mb-stack-md">
        <p class="text-label-md text-on-surface-variant font-semibold mb-1">{props.section.title}</p>
        <Show when={props.section.subTitle}>
          <h2 class="font-headline text-title-md text-on-surface">{props.section.subTitle}</h2>
        </Show>
      </div>
      <ScrollRow class="flex md:grid md:grid-cols-3 overflow-x-auto hide-scrollbar gap-gutter">
        <For each={contents()}>
          {(item: any) => (
            <div class="flex-none w-[min(64vw,280px)] md:w-auto">
              <a href={item.productId ? `/products/${item.productId}` : '/shop?category=Designer'} class="block relative rounded-lg overflow-hidden group">
                <div class="aspect-[3/4] overflow-hidden">
                  <span class="absolute top-3 right-3 bg-accent-container text-on-accent-container text-label-md font-bold px-2.5 py-1 rounded-full z-10 group-hover:scale-110 transition-transform duration-300">限定</span>
                  <ProductImage src={item.cover} alt={item.name || ''} aspect="aspect-[3/4]" rounded="rounded-none" fallbackLabel={item.name} class="absolute inset-0 w-full h-full object-cover group-hover:opacity-75 transition-opacity duration-200" />
                  <div class="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent flex flex-col justify-end p-4">
                    <h3 class="text-on-surface font-headline text-title-md group-hover:translate-y-[-2px] transition-transform duration-200 text-shadow-overlay">{item.name}</h3>
                    <Show when={item.series}>
                      <p class="text-label-md text-primary mt-1 group-hover:translate-y-[-2px] transition-transform duration-200 text-shadow-overlay">{item.series}</p>
                    </Show>
                  </div>
                </div>
              </a>
            </div>
          )}
        </For>
      </ScrollRow>
    </section>
  )
}

function SectionRenderer(props: SectionRendererProps) {
  return (
    <>
      {props.section.type === 'hero' && <HeroSection {...props} />}
      {props.section.type === 'videos' && <VideosSection {...props} />}
      {props.section.type === 'product_row' && <ProductRowSection {...props} />}
      {props.section.type === 'card_grid' && <CardGridSection {...props} />}
      {props.section.type === 'designer_grid' && <DesignerGridSection {...props} />}
    </>
  )
}

export default function HomeContent() {
  const [pageData, { refetch }] = createResource(async () => {
    if (typeof window === 'undefined') return { sections: [], products: {} }
    const sRes = await api.homeSections.list()
    const sections = sRes.data?.items?.filter(s => s.isActive) || []
    const ids = new Set<number>()
    for (const sec of sections) {
      for (const item of sec.data?.contents || []) {
        if (item.productId) ids.add(item.productId)
      }
    }
    const products: Record<number, ProductData> = {}
    await Promise.all(Array.from(ids).map(async (id) => {
      try { const r = await api.products.get(String(id)); if (r.success && r.data) products[id] = r.data } catch {}
    }))
    return { sections, products }
  })

  onMount(() => refetch())

  return (
    <main class="pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0 md:pt-16">
      <For each={pageData()?.sections}>
        {(section) => (
          <SectionRenderer section={section} products={pageData()?.products || {}} />
        )}
      </For>
    </main>
  )
}
