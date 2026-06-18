import { createSignal, onMount, onCleanup } from 'solid-js'

const STORAGE_KEY = 'cshop-theme'

type Theme = 'dark' | 'light'

function getStoredTheme(): Theme | null {
  if (typeof localStorage === 'undefined') return null
  const value = localStorage.getItem(STORAGE_KEY)
  return value === 'dark' || value === 'light' ? value : null
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(STORAGE_KEY, theme)
}

export default function ThemeToggle(props: { class?: string }) {
  const [theme, setTheme] = createSignal<Theme>('dark')

  onMount(() => {
    const stored = getStoredTheme()
    const initial = stored || 'dark'
    setTheme(initial)
    applyTheme(initial)

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
        const next = e.newValue as Theme
        setTheme(next)
        applyTheme(next)
      }
    }
    window.addEventListener('storage', onStorage)
    onCleanup(() => window.removeEventListener('storage', onStorage))
  })

  const toggle = () => {
    const next = theme() === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      class={`tap-target flex items-center justify-center rounded-full transition-colors ${props.class || ''}`}
      aria-label={theme() === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
    >
      <span class="material-symbols-outlined">
        {theme() === 'dark' ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  )
}
