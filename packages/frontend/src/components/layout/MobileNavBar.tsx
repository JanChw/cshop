import { createSignal, onMount, onCleanup } from 'solid-js'

interface NavItem {
  href: string
  label: string
  icon: string
  activeIcon?: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: '首页', icon: 'home' },
  { href: '/design', label: '设计', icon: 'brush' },
  { href: '/cart', label: '购物车', icon: 'shopping_cart' },
  { href: '/shop', label: '商店', icon: 'storefront' },
  { href: '/person', label: '我的', icon: 'person' }
]

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
    <nav
      style={{ "view-transition-name": "mobile-nav-bar" }}
      class="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface/95 backdrop-blur-lg border-t border-outline-variant flex items-center px-2 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))]"
      aria-label="主导航"
    >
      {NAV_ITEMS.map((item) => {
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
            <span
              class="material-symbols-outlined text-2xl"
              style={active ? "font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined}
            >
              {item.icon}
            </span>
          </a>
        )
      })}
    </nav>
  )
}
