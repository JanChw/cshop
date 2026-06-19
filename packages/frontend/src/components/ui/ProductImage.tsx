import { createSignal, onMount, onCleanup } from 'solid-js'

interface Props {
  src: string
  alt: string
  class?: string
  aspect?: string
  rounded?: string
  objectFit?: 'cover' | 'contain'
  fallbackLabel?: string
  eager?: boolean
}

export default function ProductImage(props: Props) {
  const [loaded, setLoaded] = createSignal(false)
  const [error, setError] = createSignal(false)

  const aspect = props.aspect || 'aspect-[4/5]'
  const rounded = props.rounded || 'rounded-lg'
  const fit = props.objectFit || 'cover'

  let imgRef: HTMLImageElement | undefined

  function markLoaded(img: HTMLImageElement) {
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setLoaded(true)
    } else {
      setError(true)
    }
  }

  onMount(() => {
    const img = imgRef
    if (!img) return
    if (img.complete) {
      markLoaded(img)
      return
    }
    const onLoad = () => markLoaded(img)
    const onError = () => setError(true)
    img.addEventListener('load', onLoad)
    img.addEventListener('error', onError)
    onCleanup(() => {
      img.removeEventListener('load', onLoad)
      img.removeEventListener('error', onError)
    })
  })

  return (
    <div class={`relative ${aspect} ${rounded} overflow-hidden bg-surface-container`}>
      <div
        class={`absolute inset-0 z-10 bg-gradient-to-br from-surface-container via-surface-container-high to-surface-container transition-opacity duration-500 ${loaded() ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      />
      <img
        ref={imgRef}
        class={`absolute inset-0 w-full h-full object-${fit} z-20 transition-opacity duration-500 ${loaded() ? 'opacity-100' : 'opacity-0'} ${props.class || ''}`}
        src={props.src}
        alt={props.alt}
        loading={props.eager ? 'eager' : 'lazy'}
      />
      {error() && (
        <div class="absolute inset-0 z-30 flex items-center justify-center bg-surface-container text-on-surface-variant">
          <span class="material-symbols-outlined text-3xl">broken_image</span>
        </div>
      )}
    </div>
  )
}
