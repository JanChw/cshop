import { createSignal } from 'solid-js'

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

function seedFromString(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i)
  return Math.abs(h).toString(36)
}

export default function ProductImage(props: Props) {
  const [loaded, setLoaded] = createSignal(false)
  const [error, setError] = createSignal(false)

  const aspect = props.aspect || 'aspect-[4/5]'
  const rounded = props.rounded || 'rounded-lg'
  const fit = props.objectFit || 'cover'
  const label = props.fallbackLabel ?? (props.alt || 'image')
  const seed = seedFromString(label)

  return (
    <div class={`relative ${aspect} ${rounded} overflow-hidden bg-surface-container`}>
      <img
        class={`absolute inset-0 w-full h-full object-${fit} z-10 transition-opacity duration-500 ${loaded() ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        src={`https://picsum.photos/seed/${seed}/600/800`}
        alt={label}
        loading="eager"
      />
      <img
        class={`absolute inset-0 w-full h-full object-${fit} z-20 transition-opacity duration-500 ${loaded() ? 'opacity-100' : 'opacity-0'} ${props.class || ''}`}
        src={props.src}
        alt={props.alt}
        loading={props.eager ? 'eager' : 'lazy'}
        onLoad={(e) => {
          const img = e.currentTarget
          if (img.naturalWidth === 0 || img.naturalHeight === 0) {
            setError(true)
          } else {
            setLoaded(true)
          }
        }}
        onError={() => setError(true)}
      />
    </div>
  )
}
