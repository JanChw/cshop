import { onMount } from 'solid-js'

const STORAGE_KEY = 'cshop-theme'
type Theme = 'dark' | 'light'

function getStoredTheme(): Theme | null {
  if (typeof localStorage === 'undefined') return null
  const value = localStorage.getItem(STORAGE_KEY)
  return value === 'dark' || value === 'light' ? value : null
}

export default function ThemeInitializer() {
  onMount(() => {
    const stored = getStoredTheme()
    if (stored && stored !== 'dark') {
      document.documentElement.setAttribute('data-theme', stored)
    }
  })

  return null
}
