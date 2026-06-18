import { createSignal } from 'solid-js'
import ProductImage from '../ui/ProductImage'
import { showToast } from '../../lib/toast'

const STATS = [
  { label: '我的设计', value: '24', href: '/person/designs' },
  { label: '已下单', value: '12', href: '/order' },
  { label: '获赞', value: '156' },
  { label: '积分', value: '890' }
]

const WORKS = [
  { title: '极简未来主义 T-Shirt', image: 'https://picsum.photos/seed/ff2170db26d3/400/500', draft: true },
  { title: '朋克复兴 Hoodie', image: 'https://picsum.photos/seed/4ffe72d06ca3/400/500', draft: false }
]

const ORDER_ACTIONS = [
  { icon: 'account_balance_wallet', label: '待付款', href: '/order' },
  { icon: 'package_2', label: '待发货', href: '/order' },
  { icon: 'local_shipping', label: '运输中', href: '/order', badge: true },
  { icon: 'rate_review', label: '待评价', href: '/order' }
]

const SETTINGS = [
  { icon: 'person', label: '个人资料修改', href: '/person/edit' },
  { icon: 'shield', label: '账号与安全', href: '/person/security' },
  { icon: 'notifications', label: '消息推送设置', href: '#' },
  { icon: 'perm_media', label: '个人素材库', href: '/person/assets' },
  { icon: 'help', label: '帮助与反馈', href: '/person/help' }
]

export default function ProfileContent() {
  const [activeWorkTab, setActiveWorkTab] = createSignal<'drafts' | 'ordered'>('drafts')

  const handleSettingClick = (href: string) => {
    if (href === '#') {
      showToast('消息推送设置功能即将上线')
    }
  }

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      showToast('已退出登录')
    }
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
              <div class="absolute bottom-0 right-0 bg-primary text-on-primary text-label-md px-2 py-0.5 rounded-full font-medium shadow-sm">LV.4</div>
            </div>
            <h1 class="text-headline-lg-mobile text-on-surface">陈小周</h1>
            <p class="text-body-sm text-secondary mb-stack-md">高级定制设计师 · Creator</p>
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
            {STATS.map((stat) => (
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
                  class={`px-4 py-1 text-label-md rounded-md transition-all tap-target ${
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
                  class={`px-4 py-1 text-label-md rounded-md transition-all tap-target ${
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
              {WORKS.map((work) => (
              <div class="group relative aspect-[4/5] bg-surface-container rounded-xl overflow-hidden border border-outline-variant hover:opacity-95 transition-opacity">
                <ProductImage
                  src={work.image}
                  alt={work.title}
                  aspect="aspect-[4/5]"
                  rounded="rounded-none"
                  fallbackLabel={work.title}
                  class="w-full h-full"
                />
                <div class="absolute bottom-0 left-0 w-full p-stack-sm bg-gradient-to-t from-black/60 to-transparent">
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
                {ORDER_ACTIONS.map((action, idx) => (
                  <>
                    <a href={action.href} class="flex flex-col items-center gap-1 text-secondary hover:text-primary transition-colors tap-target relative">
                      <span class="material-symbols-outlined text-2xl">{action.icon}</span>
                      <span class="text-label-md">{action.label}</span>
                      {action.badge && <span class="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full" />}
                    </a>
                    {idx < ORDER_ACTIONS.length - 1 && <div class="h-8 w-px bg-outline-variant" />}
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
                    class="flex items-center justify-between p-stack-md hover:bg-surface-container-low transition-colors cursor-pointer group tap-target"
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
    </main>
  )
}
