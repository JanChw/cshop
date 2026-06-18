interface Props {
  placeholder?: string
  value?: string
  onInput?: (value: string) => void
  onClear?: () => void
  class?: string
  size?: 'default' | 'sm'
  autoFocus?: boolean
}

export default function SearchInput(props: Props) {
  return (
    <div class={`relative ${props.class || ''}`}>
      <span
        class={`material-symbols-outlined absolute top-1/2 -translate-y-1/2 text-on-surface-variant ${
          props.size === 'sm' ? 'left-3 text-lg' : 'left-4'
        }`}
      >
        search
      </span>
      <input
        type="text"
        class={`w-full bg-surface-container-low border border-outline-variant rounded-full text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all ${
          props.size === 'sm'
            ? 'py-2.5 pl-10 pr-10 text-body-sm'
            : 'py-4 pl-12 pr-6'
        }`}
        placeholder={props.placeholder || '搜索...'}
        value={props.value || ''}
        onInput={(e) => props.onInput?.(e.currentTarget.value)}
        autofocus={props.autoFocus}
      />
      {props.onClear && props.value && (
        <button
          type="button"
          onClick={() => props.onClear?.()}
          class={`absolute top-1/2 -translate-y-1/2 tap-target flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container ${
            props.size === 'sm' ? 'right-1.5 w-6 h-6' : 'right-3 w-7 h-7'
          }`}
          aria-label="清除"
        >
          <span class="material-symbols-outlined text-lg">close</span>
        </button>
      )}
    </div>
  )
}
