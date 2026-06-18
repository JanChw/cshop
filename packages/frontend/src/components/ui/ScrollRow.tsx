import { type JSX } from 'solid-js'

interface Props {
  children: JSX.Element
  class?: string
}

export default function ScrollRow(props: Props) {
  return (
    <div
      class={props.class}
      onWheel={(e) => {
        const el = e.currentTarget
        if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return
        if (el.scrollWidth <= el.clientWidth) return
        const atStart = el.scrollLeft <= 0 && e.deltaY < 0
        const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth && e.deltaY > 0
        if (atStart || atEnd) return
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }}
    >
      {props.children}
    </div>
  )
}
