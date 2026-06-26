import { createSignal, onMount, onCleanup, Show } from 'solid-js'
import { cartCount, refreshCartCount } from '../../lib/cartStore'

interface NavItem {
  href: string
  label: string
  icon: string
  activeIcon?: string
}

function makeNavItems(loggedIn: boolean): NavItem[] {
  return [
    { href: '/', label: '首页', icon: 'home' },
    { href: '/design', label: '设计', icon: 'brush' },
    { href: '/cart', label: '购物车', icon: 'shopping_cart' },
    { href: '/shop', label: '商店', icon: 'storefront' },
    loggedIn
      ? { href: '/person', label: '我的', icon: 'person' }
      : { href: '/login', label: '登录', icon: 'login' }
  ]
}

function isActive(path: string, href: string) {
  if (href === '/') return path === '/'
  return path === href || path.startsWith(`${href}/`)
}

interface Props {
  currentPath?: string
}

export default function MobileNavBar(props: Props) {
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
    <nav
      style={{ "view-transition-name": "mobile-nav-bar" }}
      class="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface/95 backdrop-blur-lg border-t border-outline-variant flex items-center px-2 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))]"
      aria-label="主导航"
    >
      {makeNavItems(loggedIn()).map((item) => {
        const active = isActive(activePath(), item.href)
        return (
          <a
            href={item.href}
            class={`flex flex-1 min-w-0 flex-col items-center justify-center py-1 rounded-xl transition-colors ${
               active
                 ? 'text-accent'
                 : 'text-on-surface-variant hover:text-primary'
            }`}
            aria-current={active ? 'page' : undefined}
            aria-label={item.label}
          >
            <span class="relative">
              <span
                class="material-symbols-outlined text-2xl"
                style={active ? "font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined}
              >
                {item.icon}
              </span>
              <Show when={item.href === '/cart' && cartCount() > 0}>
                <span class="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-error text-on-error text-[10px] font-bold leading-4 text-center flex items-center justify-center">
                  {cartCount() > 99 ? '99+' : cartCount()}
                </span>
              </Show>
            </span>
          </a>
        )
      })}
    </nav>
  )
}
