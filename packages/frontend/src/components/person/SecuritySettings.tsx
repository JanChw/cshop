import { createSignal, onMount, onCleanup, Show } from 'solid-js'
import ProductImage from '../ui/ProductImage'
import { showToast } from '../../lib/toast'
import { api, clearAuth } from '../../lib/api'

function maskPhone(phone: string): string {
  return phone ? phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : ''
}

export default function SecuritySettings () {
  const [shieldAnimating, setShieldAnimating] = createSignal(true)
  const [user, setUser] = createSignal<any>(null)

  const [pwdOpen, setPwdOpen] = createSignal(false)
  const [oldPwd, setOldPwd] = createSignal('')
  const [newPwd, setNewPwd] = createSignal('')
  const [confirmPwd, setConfirmPwd] = createSignal('')
  const [showOld, setShowOld] = createSignal(false)
  const [showNew, setShowNew] = createSignal(false)
  const [saving, setSaving] = createSignal(false)

  const [phoneOpen, setPhoneOpen] = createSignal(false)
  const [phoneInput, setPhoneInput] = createSignal('')
  const [codeInput, setCodeInput] = createSignal('')
  const [sending, setSending] = createSignal(false)
  const [binding, setBinding] = createSignal(false)
  const [countdown, setCountdown] = createSignal(0)
  let timer: ReturnType<typeof setInterval> | undefined

  onMount(async () => {
    requestAnimationFrame(() => setShieldAnimating(false))
    try {
      const res: any = await api.user.get()
      if (res.success) setUser(res.data)
    } catch { /* ignore */ }
  })

  onCleanup(() => { if (timer) clearInterval(timer) })

  const settings = () => [
    { icon: 'lock_reset', label: '修改登录密码', hint: '定期更换更安全', action: 'password' },
    { icon: 'phone_android', label: '绑定手机号', hint: user()?.phone ? maskPhone(user().phone) : '未绑定', action: 'phone' },
    { icon: 'devices', label: '登录设备管理', hint: '', action: 'placeholder' }
  ]

  const handleAction = (action: string) => {
    if (action === 'password') {
      setOldPwd(''); setNewPwd(''); setConfirmPwd('')
      setPwdOpen(true)
    } else if (action === 'phone') {
      setPhoneInput(user()?.phone || '')
      setCodeInput('')
      setCountdown(0)
      setPhoneOpen(true)
    } else {
      showToast('功能即将上线')
    }
  }

  const closePwd = () => { setPwdOpen(false); setSaving(false) }

  const submitPassword = async () => {
    if (!oldPwd()) { showToast('请输入原密码'); return }
    if (newPwd().length < 6) { showToast('新密码至少 6 位'); return }
    if (newPwd() !== confirmPwd()) { showToast('两次输入的新密码不一致'); return }
    setSaving(true)
    try {
      await api.auth.changePassword(oldPwd(), newPwd())
      showToast('密码修改成功，请重新登录')
      closePwd()
      clearAuth()
      setTimeout(() => { window.location.href = '/login' }, 800)
    } catch (e: any) {
      showToast(e.message || '修改失败')
    } finally {
      setSaving(false)
    }
  }

  const startCountdown = () => {
    setCountdown(60)
    timer = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) { clearInterval(timer); timer = undefined; return 0 }
        return n - 1
      })
    }, 1000)
  }

  const closePhone = () => { setPhoneOpen(false); setBinding(false); setSending(false) }

  const sendCode = async () => {
    const phone = phoneInput().trim()
    if (!/^1[3-9]\d{9}$/.test(phone)) { showToast('请输入正确的手机号'); return }
    if (countdown() > 0) return
    setSending(true)
    try {
      const res: any = await api.auth.sendPhoneCode(phone)
      if (res.success) {
        showToast(res.data?.message || '验证码已发送')
        startCountdown()
      }
    } catch (e: any) {
      showToast(e.message || '发送失败')
    } finally {
      setSending(false)
    }
  }

  const bindPhone = async () => {
    const phone = phoneInput().trim()
    const code = codeInput().trim()
    if (!/^1[3-9]\d{9}$/.test(phone)) { showToast('请输入正确的手机号'); return }
    if (!/^\d{6}$/.test(code)) { showToast('请输入 6 位验证码'); return }
    setBinding(true)
    try {
      const res: any = await api.auth.bindPhone(phone, code)
      if (res.success) {
        showToast('手机号绑定成功')
        setUser((u) => u ? { ...u, phone: res.data.phone } : u)
        closePhone()
      }
    } catch (e: any) {
      showToast(e.message || '绑定失败')
    } finally {
      setBinding(false)
    }
  }

  return (
    <div class='bg-background min-h-screen pb-24 text-on-surface md:pt-16'>
      <header class='sticky top-0 md:top-16 z-50 bg-surface h-16 flex justify-between items-center px-4 border-b border-outline-variant'>
        <div class='flex items-center gap-4'>
          <a
            href='/person'
            class='tap-target p-2 hover:bg-primary/10 hover:text-primary transition-colors rounded-full'
            aria-label='返回'
          >
            <span class='material-symbols-outlined text-primary'>arrow_back</span>
          </a>
          <h1 class='text-lg font-bold text-primary'>账号与安全</h1>
        </div>
        <button
          type='button'
          onClick={() => showToast('安全帮助信息')}
          class='tap-target p-2 hover:bg-primary/10 hover:text-primary transition-colors rounded-full'
          aria-label='帮助'
        >
          <span class='material-symbols-outlined text-primary'>info</span>
        </button>
      </header>

      <main class='container-content py-6 space-y-6 pb-24'>
        <section class='bg-surface-container-low p-6 md:p-8 rounded-xl border border-outline-variant/60 flex flex-col md:flex-row md:items-center md:gap-6 text-center md:text-left shadow-sm'>
          <div class='relative mb-4 md:mb-0 mx-auto md:mx-0'>
            <div class='w-20 h-20 rounded-full border-4 border-primary/20 flex items-center justify-center'>
              <span
                class={`material-symbols-outlined text-4xl text-primary transition-transform duration-500 ${shieldAnimating() ? 'scale-0' : 'scale-100'}`}
                style="font-variation-settings:'FILL' 1"
              >
                verified_user
              </span>
            </div>
            <div class='absolute -bottom-1 -right-1 bg-primary text-on-primary p-1 rounded-full border-2 border-surface'>
              <span class='material-symbols-outlined text-sm'>check</span>
            </div>
          </div>
          <div>
            <h2 class='font-headline text-2xl font-bold text-on-surface mb-1'>账号安全等级：高</h2>
            <p class='text-on-surface-variant text-sm'>您的账号正处于严密保护中，请继续保持良好的安全习惯</p>
          </div>
        </section>

        <div class='md:flex md:gap-6'>
          <div class='md:w-1/2 space-y-2'>
            <h3 class='px-2 text-label-md font-bold text-primary mb-2'>安全设置</h3>
            <div class='bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/40'>
              {settings().map((item, i) => (
                <div>
                  <button
                    type='button'
                    onClick={() => handleAction(item.action)}
                    class='w-full flex items-center justify-between p-5 hover:bg-primary/10 transition-colors group tap-target text-left'
                  >
                    <div class='flex items-center gap-4'>
                      <div class='bg-primary/10 p-2 rounded-lg text-primary'>
                        <span class='material-symbols-outlined'>{item.icon}</span>
                      </div>
                      <span class='text-on-surface font-medium'>{item.label}</span>
                    </div>
                    <div class='flex items-center gap-2'>
                      {item.hint && <span class='text-sm text-on-surface-variant'>{item.hint}</span>}
                      <span class='material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform'>chevron_right</span>
                    </div>
                  </button>
                  {i < settings.length - 1 && <div class='h-px bg-outline-variant/30 mx-5' />}
                </div>
              ))}
            </div>
          </div>

          <div class='md:w-1/2 space-y-2 mt-6 md:mt-0'>
            <h3 class='px-2 text-label-md font-bold text-primary mb-2'>更多</h3>
            <div class='bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/40'>
              <button
                type='button'
                onClick={async () => {
                  const confirmText = prompt('注销账号不可撤销，请输入「确认注销」以继续：')
                  if (confirmText !== '确认注销') {
                    if (confirmText !== null) showToast('已取消')
                    return
                  }
                  try {
                    const res = await fetch('/api/v1/auth/account/deactivate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('cshop_token') || localStorage.getItem('cshop_token')}` },
                      body: JSON.stringify({ confirm: '确认注销' })
                    })
                    const json = await res.json()
                    if (json.success) {
                      localStorage.removeItem('cshop_token')
                      localStorage.removeItem('cshop_refresh')
                      localStorage.removeItem('cshop_user')
                      sessionStorage.removeItem('cshop_token')
                      sessionStorage.removeItem('cshop_refresh')
                      sessionStorage.removeItem('cshop_user')
                      showToast('账号已注销')
                      setTimeout(() => { window.location.href = '/' }, 800)
                    } else {
                      showToast(json.error || '注销失败')
                    }
                  } catch (e) {
                    showToast('网络错误')
                  }
                }}
                class='w-full flex items-center justify-between p-5 hover:bg-primary/10 transition-colors group tap-target text-left'
              >
                <div class='flex items-center gap-4'>
                  <div class='bg-tertiary-container/10 p-2 rounded-lg text-tertiary'>
                    <span class='material-symbols-outlined'>no_accounts</span>
                  </div>
                  <span class='text-on-surface font-medium'>账号注销</span>
                </div>
                <span class='material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform'>chevron_right</span>
              </button>
            </div>

            <div class='mt-6 rounded-2xl overflow-hidden relative aspect-video shadow-lg'>
              <div class='absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10' />
              <ProductImage
                src='https://picsum.photos/seed/security-hero/800/450'
                alt='数据隐私保护'
                aspect='aspect-video'
                rounded='rounded-2xl'
                fallbackLabel='数据隐私保护'
                class='w-full h-full brightness-90'
              />
              <div class='absolute bottom-4 left-6 z-20 text-on-surface'>
                <h4 class='font-headline text-lg font-bold'>数据隐私保护</h4>
                <p class='text-xs opacity-80'>我们致力于守护您的每一份数据资产</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Show when={pwdOpen()}>
        <div class='fixed inset-0 z-50 flex items-end'>
          <div
            class='absolute inset-0 bg-black/60'
            onClick={closePwd}
            role='presentation'
          />
          <div class='relative w-full bg-surface rounded-t-2xl max-h-[85vh] overflow-y-auto hide-scrollbar shadow-2xl'>
            <div class='sticky top-0 bg-surface rounded-t-2xl z-10'>
              <div class='flex justify-center pt-3 pb-1'>
                <div class='w-10 h-1 rounded-full bg-outline-variant/60' />
              </div>
              <div class='flex items-center justify-between px-6 pb-4'>
                <h3 class='text-title-md font-bold text-on-surface'>修改登录密码</h3>
                <button
                  type='button'
                  onClick={closePwd}
                  class='tap-target p-1 rounded-full hover:bg-primary/10 hover:text-primary transition-colors'
                  aria-label='关闭'
                >
                  <span class='material-symbols-outlined text-on-surface-variant'>close</span>
                </button>
              </div>
            </div>

            <div class='px-6 space-y-5 pb-6'>
              <div class='space-y-2'>
                <label class='text-label-md font-medium text-on-surface-variant ml-1' for='pwd-old'>原密码</label>
                <div class='relative'>
                  <input
                    id='pwd-old'
                    class='w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 pr-12 text-on-surface font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none'
                    type={showOld() ? 'text' : 'password'}
                    placeholder='请输入原密码'
                    value={oldPwd()}
                    onInput={(e) => setOldPwd(e.currentTarget.value)}
                  />
                  <button
                    type='button'
                    onClick={() => setShowOld(!showOld())}
                    class='absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant tap-target'
                    aria-label={showOld() ? '隐藏密码' : '显示密码'}
                  >
                    <span class='material-symbols-outlined'>{showOld() ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div class='space-y-2'>
                <label class='text-label-md font-medium text-on-surface-variant ml-1' for='pwd-new'>新密码</label>
                <div class='relative'>
                  <input
                    id='pwd-new'
                    class='w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 pr-12 text-on-surface font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none'
                    type={showNew() ? 'text' : 'password'}
                    placeholder='至少 6 位'
                    value={newPwd()}
                    onInput={(e) => setNewPwd(e.currentTarget.value)}
                  />
                  <button
                    type='button'
                    onClick={() => setShowNew(!showNew())}
                    class='absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant tap-target'
                    aria-label={showNew() ? '隐藏密码' : '显示密码'}
                  >
                    <span class='material-symbols-outlined'>{showNew() ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div class='space-y-2'>
                <label class='text-label-md font-medium text-on-surface-variant ml-1' for='pwd-confirm'>确认新密码</label>
                <input
                  id='pwd-confirm'
                  class='w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none'
                  type={showNew() ? 'text' : 'password'}
                  placeholder='再次输入新密码'
                  value={confirmPwd()}
                  onInput={(e) => setConfirmPwd(e.currentTarget.value)}
                />
              </div>
              <p class='text-label-md text-on-surface-variant/70 ml-1'>修改成功后将退出当前登录，请使用新密码重新登录</p>
            </div>

            <div class='sticky bottom-0 bg-surface px-6 py-4 border-t border-outline-variant pb-[calc(16px+env(safe-area-inset-bottom))]'>
              <button
                type='button'
                onClick={submitPassword}
                disabled={saving()}
                class='w-full h-12 bg-primary hover:opacity-90 active:scale-95 transition-opacity transition-transform duration-200 rounded-xl text-on-primary font-bold tracking-wider tap-target disabled:opacity-60'
              >
                {saving() ? '修改中...' : '确认修改'}
              </button>
            </div>
          </div>
        </div>
      </Show>

      <Show when={phoneOpen()}>
        <div class='fixed inset-0 z-50 flex items-end'>
          <div
            class='absolute inset-0 bg-black/60'
            onClick={closePhone}
            role='presentation'
          />
          <div class='relative w-full bg-surface rounded-t-2xl max-h-[85vh] overflow-y-auto hide-scrollbar shadow-2xl'>
            <div class='sticky top-0 bg-surface rounded-t-2xl z-10'>
              <div class='flex justify-center pt-3 pb-1'>
                <div class='w-10 h-1 rounded-full bg-outline-variant/60' />
              </div>
              <div class='flex items-center justify-between px-6 pb-4'>
                <h3 class='text-title-md font-bold text-on-surface'>绑定手机号</h3>
                <button
                  type='button'
                  onClick={closePhone}
                  class='tap-target p-1 rounded-full hover:bg-primary/10 hover:text-primary transition-colors'
                  aria-label='关闭'
                >
                  <span class='material-symbols-outlined text-on-surface-variant'>close</span>
                </button>
              </div>
            </div>

            <div class='px-6 space-y-5 pb-6'>
              <p class='text-label-md text-on-surface-variant ml-1'>验证码将发送至您的注册邮箱（{user()?.email || ''}）</p>

              <div class='space-y-2'>
                <label class='text-label-md font-medium text-on-surface-variant ml-1' for='bind-phone'>手机号</label>
                <input
                  id='bind-phone'
                  class='w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none'
                  type='tel'
                  inputmode='numeric'
                  maxlength='11'
                  placeholder='请输入手机号'
                  value={phoneInput()}
                  onInput={(e) => setPhoneInput(e.currentTarget.value.replace(/\D/g, '').slice(0, 11))}
                />
              </div>

              <div class='space-y-2'>
                <label class='text-label-md font-medium text-on-surface-variant ml-1' for='bind-code'>验证码</label>
                <div class='flex gap-3'>
                  <input
                    id='bind-code'
                    class='flex-1 bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none'
                    type='text'
                    inputmode='numeric'
                    maxlength='6'
                    placeholder='6 位验证码'
                    value={codeInput()}
                    onInput={(e) => setCodeInput(e.currentTarget.value.replace(/\D/g, '').slice(0, 6))}
                  />
                  <button
                    type='button'
                    onClick={sendCode}
                    disabled={sending() || countdown() > 0}
                    class='shrink-0 px-4 py-3 rounded-lg border border-primary text-primary font-semibold text-label-md hover:bg-primary/10 transition-colors tap-target disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {countdown() > 0 ? `${countdown()}s` : sending() ? '发送中' : '发送验证码'}
                  </button>
                </div>
              </div>
            </div>

            <div class='sticky bottom-0 bg-surface px-6 py-4 border-t border-outline-variant pb-[calc(16px+env(safe-area-inset-bottom))]'>
              <button
                type='button'
                onClick={bindPhone}
                disabled={binding()}
                class='w-full h-12 bg-primary hover:opacity-90 active:scale-95 transition-opacity transition-transform duration-200 rounded-xl text-on-primary font-bold tracking-wider tap-target disabled:opacity-60'
              >
                {binding() ? '绑定中...' : '确认绑定'}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}
