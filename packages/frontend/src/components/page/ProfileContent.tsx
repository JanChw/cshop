import { createSignal, onMount } from 'solid-js'
import ProductImage from '../ui/ProductImage'
import ThemeToggle from '../ui/ThemeToggle'
import ConfirmDialog from '../ui/ConfirmDialog'
import { showToast } from '../../lib/toast'
import { api } from '../../lib/api'

const SETTINGS = [
  { icon: 'person', label: '个人资料修改', href: '/person/edit' },
  { icon: 'shield', label: '账号与安全', href: '/person/security' },
  { icon: 'notifications', label: '消息推送设置', href: '#' },
  { icon: 'perm_media', label: '个人素材库', href: '/person/assets' },
  { icon: 'help', label: '帮助与反馈', href: '/person/help' }
]

export default function ProfileContent() {
  const [activeWorkTab, setActiveWorkTab] = createSignal<'drafts' | 'ordered'>('drafts')
  const [showLogoutConfirm, setShowLogoutConfirm] = createSignal(false)
  const [user, setUser] = createSignal<any>(null)
  const [designs, setDesigns] = createSignal<any[]>([])
  const [orders, setOrders] = createSignal<any[]>([])

  onMount(async () => {
    try {
      const [userRes, designsRes, ordersRes] = await Promise.all([
        api.user.get(),
        api.designs.list(),
        api.orders.list()
      ])
      if (userRes.success) setUser(userRes.data)
      if (designsRes.success) setDesigns(designsRes.data.items || [])
      if (ordersRes.success) setOrders(ordersRes.data.items || [])
    } catch (e) {
      console.error('Failed to load profile data', e)
    }
  })

  const stats = () => [
    { label: '我的设计', value: String(designs().length), href: '/person/designs' },
    { label: '已下单', value: String(orders().length), href: '/order' },
    { label: '获赞', value: '0' },
    { label: '积分', value: '0' }
  ]

  const works = () => designs().map((d: any) => ({
    title: d.name || '未命名设计',
    image: d.previewImage || `https://picsum.photos/seed/${d.id}/400/500`,
    draft: true
  }))

  const orderActions = () => {
    const unpaid = orders().filter((o: any) => o.status === 'unpaid' || o.status === 'pending').length
    const undelivered = orders().filter((o: any) => o.status === 'paid' || o.status === 'confirmed').length
    const shipping = orders().filter((o: any) => o.status === 'shipped').length
    const unreviewed = orders().filter((o: any) => o.status === 'delivered').length
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
    localStorage.removeItem('cshop_token')
    localStorage.removeItem('cshop_refresh')
    localStorage.removeItem('cshop_user')
    window.location.href = '/login'
  }

  return (
    <main class="md:pt-16 pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-8 min-h-screen container-content">
      <div class="md:flex md:gap-8 md:py-8">
        {/* Left sidebar */}
        <aside class="md:w-[35%] md:sticky md:top-20 md:self-start">
          <header class="py-stack-lg flex flex-col items-center text-center">
            <div class="relative mb-stack-md">
              <div class="w-24 h-24 rounded-full p-0.5 bg-primary">
                <div class="w-full h-full rounded-full bg-primary-container flex items-center justify-center text-primary border-4 border-surface">
                  <span class="material-symbols-outlined text-4xl">person</span>
                </div>
              </div>
              <div class="absolute bottom-0 right-0 bg-primary text-on-primary text-label-md px-2 py-0.5 rounded-full font-medium">LV.4</div>
            </div>
            <h1 class="text-headline-lg-mobile text-on-surface">{user()?.name || '用户'}</h1>
            <p class="text-body-sm text-secondary mb-stack-md">{user()?.bio ? user().bio.slice(0, 30) : '欢迎来到 CShop'}</p>
            <div class="flex gap-stack-sm flex-wrap justify-center">
              <div class="flex items-center gap-1 px-3 py-1 bg-surface-container rounded-full border border-outline-variant">
                <span class="material-symbols-outlined text-xs text-primary" style="font-variation-settings:'FILL' 1">check_circle</span>
                <span class="text-label-md">微信已绑定</span>
              </div>
              <div class="flex items-center gap-1 px-3 py-1 bg-surface-container rounded-full border border-outline-variant">
                <span class="material-symbols-outlined text-xs text-outline">link_off</span>
                <span class="text-label-md">QQ未绑定</span>
              </div>
            </div>
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
              <h2 class="text-title-md text-on-surface">我的作品廊</h2>
              <div class="flex bg-surface-container rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setActiveWorkTab('drafts')}
                  class={`px-4 py-1 text-label-md rounded-md transition-colors tap-target ${
                    activeWorkTab() === 'drafts'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  草稿箱
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWorkTab('ordered')}
                  class={`px-4 py-1 text-label-md rounded-md transition-colors tap-target ${
                    activeWorkTab() === 'ordered'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  已订购
                </button>
              </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-gutter">
              {works().map((work) => (
              <div class="group relative aspect-[4/5] bg-surface-container rounded-xl overflow-hidden border border-outline-variant hover:opacity-95 transition-opacity">
                <ProductImage
                  src={work.image}
                  alt={work.title}
                  aspect="aspect-[4/5]"
                  rounded="rounded-none"
                  fallbackLabel={work.title}
                  class="w-full h-full"
                />
                <div class="absolute bottom-0 left-0 w-full p-stack-sm bg-gradient-to-t from-background/80 to-transparent">
                  <p class="text-on-surface text-label-md truncate">{work.title}</p>
                </div>
                  {work.draft && (
                    <div class="absolute top-2 right-2 px-2 py-0.5 bg-primary/90 backdrop-blur-md text-on-primary text-label-md rounded">草稿</div>
                  )}
                </div>
              ))}
              <a href="/design" class="aspect-[4/5] bg-surface-container border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-colors group">
                <span class="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">add_circle</span>
                <span class="text-label-md text-secondary">开始创作</span>
              </a>
            </div>
          </section>

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
              <div class="flex items-center justify-between p-stack-md">
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
