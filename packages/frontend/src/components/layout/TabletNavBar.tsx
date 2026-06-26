import { createSignal, onMount, onCleanup, Show } from 'solid-js'
import { cartCount, refreshCartCount } from '../../lib/cartStore'
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
  const [loggedIn, setLoggedIn] = createSignal(false)

  function update() {
    setActivePath(window.location.pathname)
    setLoggedIn(!!(sessionStorage.getItem('cshop_token') || localStorage.getItem('cshop_token')))
    refreshCartCount()
  }

  onMount(() => {
    update()
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
          <span class="relative">
            <span class="material-symbols-outlined text-2xl">shopping_cart</span>
            <Show when={cartCount() > 0}>
              <span class="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-on-error text-[11px] font-bold leading-[18px] text-center flex items-center justify-center">
                {cartCount() > 99 ? '99+' : cartCount()}
              </span>
            </Show>
          </span>
        </a>
        <a
          href={loggedIn() ? '/person' : '/login'}
          class={`flex items-center justify-center h-9 tap-target transition-colors overflow-hidden ${
            isActive(activePath(), '/person') || isActive(activePath(), '/login')
              ? 'text-accent'
              : 'text-on-surface-variant'
          }`}
          style={isActive(activePath(), '/person') || isActive(activePath(), '/login') ? { 'text-shadow': '0 2px 6px rgba(0,0,0,0.85)' } : undefined}
          aria-label={loggedIn() ? '个人中心' : '登录'}
        >
          <span class="material-symbols-outlined text-xl">{loggedIn() ? 'person' : 'login'}</span>
        </a>
        <ThemeToggle class="w-9 h-9 text-on-surface-variant" />
      </div>
    </header>
  )
}
