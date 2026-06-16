interface Props {
  placeholder?: string
  value?: string
  onInput?: (value: string) => void
  class?: string
}

export default function SearchInput(props: Props) {
  return (
    <div class={`relative ${props.class || ''}`}>
      <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
      <input
        type="text"
        class="w-full bg-surface-container-low border border-outline-variant rounded-full py-4 pl-12 pr-6 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        placeholder={props.placeholder || '搜索...'}
        value={props.value || ''}
        onInput={(e) => props.onInput?.(e.currentTarget.value)}
      />
    </div>
  )
}
