import { onMount } from 'solid-js'
import { showToast } from '../../lib/toast'

export default function SecuritySettings() {
  let shieldIcon: HTMLSpanElement | undefined

  onMount(() => {
    if (shieldIcon) {
      shieldIcon.style.transition = 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
      shieldIcon.style.transform = 'scale(0)'
      setTimeout(() => { shieldIcon!.style.transform = 'scale(1)' }, 300)
    }
  })

  const settings = [
    { icon: 'lock_reset', label: '修改登录密码', hint: '定期更换更安全' },
    { icon: 'phone_android', label: '绑定手机号', hint: '138****8888' },
    { icon: 'badge', label: '实名认证', hint: '', badge: '已认证' },
    { icon: 'devices', label: '登录设备管理', hint: '' },
  ]

  return (
    <div>
      <header class="bg-surface border-b border-outline-variant flex justify-between items-center px-4 h-16 w-full sticky top-0 z-50">
        <div class="flex items-center gap-4">
          <button onclick={() => history.back()} class="p-2 hover:bg-surface-container-high transition-colors rounded-full">
            <span class="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <h1 class="text-on-surface font-headline text-xl font-semibold">账号与安全</h1>
        </div>
        <button onclick={() => showToast('安全帮助信息')} class="p-2 hover:bg-surface-container-high transition-colors rounded-full">
          <span class="material-symbols-outlined text-on-surface-variant">info</span>
        </button>
      </header>

      <main class="max-w-md mx-auto px-4 py-6 space-y-6 pb-24">
        <section class="bg-surface-container-low p-8 rounded-xl border border-outline-variant/60 flex flex-col items-center text-center shadow-sm">
          <div class="relative mb-4">
            <div class="w-20 h-20 rounded-full border-4 border-primary/20 flex items-center justify-center">
              <span ref={shieldIcon} class="material-symbols-outlined text-4xl text-primary" style="font-variation-settings:'FILL' 1">verified_user</span>
            </div>
            <div class="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full border-2 border-surface">
              <span class="material-symbols-outlined text-sm">check</span>
            </div>
          </div>
          <h2 class="font-headline text-2xl font-bold text-on-surface mb-1">账号安全等级：高</h2>
          <p class="text-on-surface-variant text-sm font-body">您的账号正处于严密保护中，请继续保持良好的安全习惯</p>
        </section>

        <div class="space-y-2">
          <h3 class="px-2 text-label-md font-bold text-primary tracking-wider uppercase mb-2">安全设置</h3>
          <div class="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/40">
            {settings.map((item, i) => (
              <div>
                <button onclick={() => showToast(`${item.label}功能即将上线`)}
                  class="w-full flex items-center justify-between p-5 hover:bg-surface-container-high transition-all group">
                  <div class="flex items-center gap-4">
                    <div class="bg-primary/10 p-2 rounded-lg text-primary"><span class="material-symbols-outlined">{item.icon}</span></div>
                    <span class="text-on-surface font-medium">{item.label}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    {item.hint && <span class="text-sm text-on-surface-variant">{item.hint}</span>}
                    {item.badge && <span class="bg-primary-container text-on-primary-container text-[10px] px-2 py-0.5 rounded-full font-bold">{item.badge}</span>}
                    <span class="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
                  </div>
                </button>
                {i < settings.length - 1 && <div class="h-[1px] bg-outline-variant/30 mx-5"></div>}
              </div>
            ))}
          </div>
        </div>

        <div class="space-y-2">
          <h3 class="px-2 text-label-md font-bold text-primary tracking-wider uppercase mb-2">更多</h3>
          <div class="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/40">
            <button onclick={async () => {
              const confirmText = prompt('注销账号不可撤销，请输入「确认注销」以继续：')
              if (confirmText !== '确认注销') {
                if (confirmText !== null) showToast('已取消')
                return
              }
              try {
                const res = await fetch('/api/v1/auth/account/deactivate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('cshop_token')}` },
                  body: JSON.stringify({ confirm: '确认注销' })
                })
                const json = await res.json()
                if (json.success) {
                  localStorage.removeItem('cshop_token')
                  localStorage.removeItem('cshop_refresh')
                  localStorage.removeItem('cshop_user')
                  showToast('账号已注销')
                  setTimeout(() => { window.location.href = '/' }, 800)
                } else {
                  showToast(json.error || '注销失败')
                }
              } catch (e) {
                showToast('网络错误')
              }
            }}
              class="w-full flex items-center justify-between p-5 hover:bg-surface-container-high transition-all group">
              <div class="flex items-center gap-4">
                <div class="bg-tertiary-container/10 p-2 rounded-lg text-tertiary"><span class="material-symbols-outlined">no_accounts</span></div>
                <span class="text-on-surface font-medium">账号注销</span>
              </div>
              <span class="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
            </button>
          </div>
        </div>

        <div class="mt-8 rounded-2xl overflow-hidden relative aspect-video shadow-lg">
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
          <img class="w-full h-full object-cover brightness-90" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWhlDdv4dfqIxDT58CnqsWbOWM2iWjCixvQwCKYbmd0xYPNt1_L5U8SfSxoLYX7sAy6WDtdJnD03tJ4zPh2ukiJY05I-sbt3ddYAy_gRDrKG0V1y8RlOwkaG0uoTOQ9HO8Arru8qtLd7zI7y146NP-cMPWmA63-WPEsTkZHgOtNTnd6epVWV7i0sxHcMetw6ZSCFUyISbpkbo5TuzsnANiwKaO6GqDn7bP2tokzo08G4nzRednG5x1yvJ1BRaYiUs_qv9MB5IeNtU" alt="数据隐私保护" />
          <div class="absolute bottom-4 left-6 z-20 text-white">
            <h4 class="font-headline text-lg font-bold">数据隐私保护</h4>
            <p class="text-xs opacity-80 font-body">我们致力于守护您的每一份数据资产</p>
          </div>
        </div>
      </main>
    </div>
  )
}
