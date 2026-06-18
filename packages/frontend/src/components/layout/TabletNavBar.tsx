import { createSignal, onMount } from 'solid-js'
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

export default function TabletNavBar() {
  const [activePath, setActivePath] = createSignal('/')

  onMount(() => {
    setActivePath(window.location.pathname)
  })

  return (
    <header
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
                  active ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
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
          class="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors tap-target"
          aria-label="搜索"
        >
          <span class="material-symbols-outlined text-lg">search</span>
        </a>
        <a
          href="/cart"
          class="p-2 rounded-full hover:bg-surface-container-high transition-colors tap-target flex items-center justify-center text-on-surface-variant hover:text-primary"
          aria-label="购物车"
        >
          <span class="material-symbols-outlined text-2xl">shopping_cart</span>
        </a>
        <ThemeToggle class="w-9 h-9 text-on-surface-variant hover:text-primary hover:bg-surface-container-high" />
        <a
          href="/person"
          class="w-9 h-9 rounded-full overflow-hidden border border-outline-variant bg-primary-container flex items-center justify-center text-primary tap-target"
          aria-label="个人中心"
        >
          <span class="material-symbols-outlined text-xl">person</span>
        </a>
      </div>
    </header>
  )
}
