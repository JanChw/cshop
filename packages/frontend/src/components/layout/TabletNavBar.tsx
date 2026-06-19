import { createSignal, onMount, onCleanup } from 'solid-js'
import ThemeToggle from '../ui/ThemeToggle'

interface NavLink {
  href: string
  label: string
}

const MAIN_LINKS: NavLink[] = [
  { href: '/', label: '首页' },
  { href: '/shop', label: '商店' },
  { href: '/design', label: '设计' }
]

function isActive(path: string, href: string) {
  if (href === '/') return path === '/'
  return path === href || path.startsWith(`${href}/`)
}

interface Props {
  currentPath?: string
}

export default function TabletNavBar(props: Props) {
  const [activePath, setActivePath] = createSignal(
    props.currentPath || '/'
  )

  onMount(() => {
    const update = () => setActivePath(window.location.pathname)
    document.addEventListener('astro:before-swap', update)
    document.addEventListener('astro:page-load', update)
    onCleanup(() => {
      document.removeEventListener('astro:before-swap', update)
      document.removeEventListener('astro:page-load', update)
    })
  })

  return (
    <header
      style={{ "view-transition-name": "tablet-nav-bar" }}
      class="hidden md:flex fixed top-0 left-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant h-16 items-center justify-between px-6"
      aria-label="顶部导航"
    >
      <div class="flex items-center gap-8">
        <a href="/" class="font-headline text-2xl font-bold text-primary tracking-tight">
          ByChooow
        </a>
        <nav class="flex items-center gap-6" aria-label="主导航">
          {MAIN_LINKS.map((link) => {
            const active = isActive(activePath(), link.href)
            return (
              <a
                href={link.href}
                class={`text-sm font-medium transition-colors ${
                   active ? 'text-accent font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
                style={active ? { 'text-shadow': '0 2px 6px rgba(0,0,0,0.85)' } : undefined}
                aria-current={active ? 'page' : undefined}
              >
                {link.label}
              </a>
            )
          })}
        </nav>
      </div>

      <div class="flex items-center gap-4">
        <a
          href="/search"
          class={`flex items-center justify-center h-10 tap-target transition-colors ${
            isActive(activePath(), '/search')
              ? 'text-accent'
              : 'text-on-surface-variant'
          }`}
          style={isActive(activePath(), '/search') ? { 'text-shadow': '0 2px 6px rgba(0,0,0,0.85)' } : undefined}
          aria-label="搜索"
        >
          <span class="material-symbols-outlined text-lg">search</span>
        </a>
        <a
          href="/cart"
          class={`flex items-center justify-center h-10 tap-target transition-colors ${
            isActive(activePath(), '/cart')
              ? 'text-accent'
              : 'text-on-surface-variant'
          }`}
          style={isActive(activePath(), '/cart') ? { 'text-shadow': '0 2px 6px rgba(0,0,0,0.85)' } : undefined}
          aria-label="购物车"
        >
          <span class="material-symbols-outlined text-2xl">shopping_cart</span>
        </a>
        <a
          href="/person"
          class={`flex items-center justify-center h-9 tap-target transition-colors overflow-hidden ${
            isActive(activePath(), '/person')
              ? 'text-accent'
              : 'text-on-surface-variant'
          }`}
          style={isActive(activePath(), '/person') ? { 'text-shadow': '0 2px 6px rgba(0,0,0,0.85)' } : undefined}
          aria-label="个人中心"
        >
          <span class="material-symbols-outlined text-xl">person</span>
        </a>
        <ThemeToggle class="w-9 h-9 text-on-surface-variant" />
      </div>
    </header>
  )
}
