import { createSignal, createEffect, onCleanup } from 'solid-js'

export function useInfiniteScroll<T>(
  allItems: () => T[],
  pageSize: number = 8
) {
  const [visibleCount, setVisibleCount] = createSignal(pageSize)
  const [loading, setLoading] = createSignal(false)

  const visibleItems = () => allItems().slice(0, visibleCount())
  const allLoaded = () => visibleCount() >= allItems().length

  let observer: IntersectionObserver | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  createEffect(() => {
    allItems()
    if (timer) clearTimeout(timer)
    timer = null
    setVisibleCount(pageSize)
    setLoading(false)
  })

  onCleanup(() => {
    if (observer) observer.disconnect()
    if (timer) clearTimeout(timer)
  })

  const sentinelRef = (el: Element | null) => {
    if (observer) observer.disconnect()
    if (!el) return
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !allLoaded() && !loading()) {
          setLoading(true)
          timer = setTimeout(() => {
            setVisibleCount(c => c + pageSize)
            setLoading(false)
          }, 100)
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(el)
  }

  const reset = () => {
    if (timer) clearTimeout(timer)
    timer = null
    setVisibleCount(pageSize)
    setLoading(false)
  }

  return { visibleItems, loading, allLoaded, sentinelRef, reset }
}
