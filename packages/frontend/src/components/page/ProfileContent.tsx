import { createSignal, onMount } from 'solid-js'
import ThemeToggle from '../ui/ThemeToggle'
import ConfirmDialog from '../ui/ConfirmDialog'
import { showToast } from '../../lib/toast'
import { api, performLogout } from '../../lib/api'

const SETTINGS = [
  { icon: 'person', label: '个人资料修改', href: '/person/edit' },
  { icon: 'shield', label: '账号与安全', href: '/person/security' },
  { icon: 'notifications', label: '消息推送设置', href: '#' },
  { icon: 'help', label: '帮助与反馈', href: '/person/help' }
]

export default function ProfileContent() {
  const [showLogoutConfirm, setShowLogoutConfirm] = createSignal(false)
  const [user, setUser] = createSignal<any>(null)
  const [orders, setOrders] = createSignal<any[]>([])
  const [favCount, setFavCount] = createSignal(0)
  const [stickerCount, setStickerCount] = createSignal(0)
  const [designCount, setDesignCount] = createSignal(0)

  onMount(async () => {
    try {
      const [userRes, designsRes, ordersRes, favRes, stickerRes] = await Promise.all([
        api.user.get(),
        api.designs.list({ page: 1, limit: 1 }),
        api.orders.list(),
        api.favorites.list({ page: 1, limit: 1 }).catch(() => null),
        api.userStickers.list({ page: 1, limit: 1 }).catch(() => null)
      ])
      if (userRes.success) setUser(userRes.data)
      if (designsRes.success) setDesignCount(designsRes.data.total ?? 0)
      if (ordersRes.success) setOrders(ordersRes.data.items || [])
      if (favRes?.success) setFavCount(favRes.data.total ?? 0)
      if (stickerRes?.success) setStickerCount(stickerRes.data.total ?? 0)
    } catch (e) {
      console.error('Failed to load profile data', e)
    }
  })

  const stats = () => [
    { label: '我的设计', value: String(designCount()), href: '/person/designs' },
    { label: '素材库', value: String(stickerCount()), href: '/person/assets' },
    { label: '我的收藏', value: String(favCount()), href: '/person/collection' }
  ]

  const orderActions = () => {
    const unpaid = orders().filter((o: any) => o.status === 'pending').length
    const undelivered = orders().filter((o: any) => o.status === 'paid' || o.status === 'processing').length
    const shipping = orders().filter((o: any) => o.status === 'shipped').length
    const unreviewed = orders().filter((o: any) => o.status === 'completed').length
    return [
      { icon: 'account_balance_wallet', label: '待付款', href: '/order', badge: unpaid > 0 },
      { icon: 'package_2', label: '待发货', href: '/order', badge: undelivered > 0 },
      { icon: 'local_shipping', label: '运输中', href: '/order', badge: shipping > 0 },
      { icon: 'rate_review', label: '待评价', href: '/order', badge: unreviewed > 0 }
    ]
  }

  const handleSettingClick = (href: string) => {
    if (href === '#') {
      showToast('消息推送设置功能即将上线')
    }
  }

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    setShowLogoutConfirm(false)
    performLogout()
  }

  return (
    <main class="md:pt-16 pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-8 min-h-screen container-content">
      <div class="md:flex md:gap-8 md:py-8">
        {/* Left sidebar */}
        <aside class="md:w-[35%] md:sticky md:top-20 md:self-start">
          <header class="py-stack-lg flex flex-col items-center text-center">
            <div class="relative mb-stack-md">
              <div class="w-24 h-24 rounded-full p-0.5 bg-primary">
              <div class="w-full h-full rounded-full bg-primary-container flex items-center justify-center text-primary border-4 border-surface overflow-hidden">
                {user()?.avatar
                  ? <img src={user().avatar} alt={user().name} class="w-full h-full object-cover" />
                  : <span class="material-symbols-outlined text-4xl">person</span>}
              </div>
              </div>
              <div class="absolute bottom-0 right-0 bg-primary text-on-primary text-label-md px-2 py-0.5 rounded-full font-medium">LV.4</div>
            </div>
            <h1 class="text-headline-lg-mobile text-on-surface">{user()?.name || '用户'}</h1>
            <p class="text-body-sm text-secondary mb-stack-md">{user()?.bio ? user().bio.slice(0, 30) : '欢迎来到 CShop'}</p>
          </header>

          <section class="grid grid-cols-2 md:grid-cols-1 gap-gutter mb-stack-lg md:mb-0">
            {stats().map((stat) => (
              stat.href ? (
                <a href={stat.href} class="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant flex flex-col items-center hover:border-primary transition-colors">
                  <span class="text-headline-lg-mobile text-primary">{stat.value}</span>
                  <span class="text-label-md text-secondary">{stat.label}</span>
                </a>
              ) : (
                <div class="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant flex flex-col items-center">
                  <span class="text-headline-lg-mobile text-primary">{stat.value}</span>
                  <span class="text-label-md text-secondary">{stat.label}</span>
                </div>
              )
            ))}
          </section>
        </aside>

        {/* Right content */}
        <div class="md:w-[65%] md:space-y-stack-lg">
          <section class="mb-stack-lg">
            <div class="flex items-center justify-between mb-stack-md">
              <h2 class="text-title-md text-on-surface">订单概览</h2>
              <a class="text-label-md text-primary flex items-center gap-1 hover:opacity-80 tap-target" href="/order">
                <span>订单管理</span>
                <span class="material-symbols-outlined text-xs">chevron_right</span>
              </a>
            </div>
            <div class="bg-surface-container-low rounded-xl p-stack-md border border-outline-variant">
              <div class="flex items-center justify-around py-2">
                {orderActions().map((action, idx) => (
                  <>
                    <a href={action.href} class="flex flex-col items-center gap-1 text-secondary hover:text-primary transition-colors tap-target relative">
                      <span class="material-symbols-outlined text-2xl">{action.icon}</span>
                      <span class="text-label-md">{action.label}</span>
                      {action.badge && <span class="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full" />}
                    </a>
                    {idx < orderActions().length - 1 && <div class="h-8 w-px bg-outline-variant" />}
                  </>
                ))}
              </div>
            </div>
          </section>

          <section class="mb-stack-lg">
            <h2 class="text-title-md text-on-surface mb-stack-md">账户设置</h2>
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
              {SETTINGS.map((setting, idx) => (
                <>
                  <a
                    href={setting.href}
                    onClick={setting.href === '#' ? (e) => { e.preventDefault(); handleSettingClick(setting.href) } : undefined}
                    class="flex items-center justify-between p-stack-md hover:bg-primary/10 transition-colors cursor-pointer group tap-target"
                  >
                    <div class="flex items-center gap-stack-md">
                      <span class="material-symbols-outlined text-secondary group-hover:text-primary">{setting.icon}</span>
                      <span class="text-body-lg">{setting.label}</span>
                    </div>
                    <span class="material-symbols-outlined text-outline">chevron_right</span>
                  </a>
                  {idx < SETTINGS.length - 1 && <div class="h-px bg-outline-variant/30 mx-stack-md" />}
                </>
              ))}
              <div class="h-px bg-outline-variant/30 mx-stack-md" />
              <div class="flex items-center justify-between p-stack-md md:hidden">
                <div class="flex items-center gap-stack-md">
                  <span class="material-symbols-outlined text-secondary">dark_mode</span>
                  <span class="text-body-lg">深色模式</span>
                </div>
                <ThemeToggle class="w-10 h-10 text-on-surface-variant hover:text-primary hover:bg-primary/10" />
              </div>
            </div>
          </section>

          <button
            type="button"
            onClick={handleLogout}
            class="w-full py-4 text-error font-bold text-body-lg border border-error/20 rounded-xl hover:bg-error/5 transition-colors mb-stack-lg tap-target"
          >
            退出登录
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm()}
        title="确认退出"
        message="确定要退出当前登录吗？"
        confirmText="退出"
        variant="danger"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </main>
  )
}
