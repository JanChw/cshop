import { type JSX, createSignal, onMount, onCleanup } from 'solid-js'

interface Props {
  children: JSX.Element
  class?: string
}

export default function ScrollRow(props: Props) {
  let ref: HTMLDivElement | undefined
  const [atEnd, setAtEnd] = createSignal(false)

  function checkScroll() {
    if (!ref) return
    setAtEnd(ref.scrollLeft + ref.clientWidth >= ref.scrollWidth - 1)
  }

  onMount(() => {
    checkScroll()
    ref?.addEventListener('scroll', checkScroll, { passive: true })
    const ro = new ResizeObserver(checkScroll)
    if (ref) ro.observe(ref)
    onCleanup(() => {
      ref?.removeEventListener('scroll', checkScroll)
      ro.disconnect()
    })
  })

  return (
    <div class="relative">
      <div
        ref={ref}
        class={props.class}
        onWheel={(e) => {
          const el = e.currentTarget
          if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return
          if (el.scrollWidth <= el.clientWidth) return
          const atStart = el.scrollLeft <= 0 && e.deltaY < 0
          const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth && e.deltaY > 0
          if (atStart || atEnd) return
          e.preventDefault()
          const delta = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY
          el.scrollLeft += delta
        }}
      >
        {props.children}
      </div>
      <div
        class="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent transition-opacity duration-200 md:hidden"
        classList={{ 'opacity-0': atEnd(), 'opacity-100': !atEnd() }}
      />
    </div>
  )
}
