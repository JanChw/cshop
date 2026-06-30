import { createSignal, Show } from 'solid-js'
import { showToast } from '../../lib/toast'
import { api } from '../../lib/api'

export default function RegisterForm() {
  const [name, setName] = createSignal('')
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [confirmPassword, setConfirmPassword] = createSignal('')
  const [agreed, setAgreed] = createSignal(false)
  const [showPassword, setShowPassword] = createSignal(false)
  const [loading, setLoading] = createSignal(false)
  const [errors, setErrors] = createSignal<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name().trim()) errs.name = '请输入姓名'
    if (!email().trim()) errs.email = '请输入邮箱或手机号'
    if (!password()) errs.password = '请输入密码'
    else if (password().length < 8) errs.password = '密码至少 8 位'
    if (password() !== confirmPassword()) errs.confirmPassword = '两次密码不一致'
    if (!agreed()) errs.terms = '请先同意用户协议'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    ;(async () => {
      try {
        const res: any = await api.auth.register(name(), email(), password())
        sessionStorage.removeItem('cshop_token')
        sessionStorage.removeItem('cshop_refresh')
        sessionStorage.removeItem('cshop_user')
        localStorage.setItem('cshop_token', res.data.accessToken)
        localStorage.setItem('cshop_refresh', res.data.refreshToken)
        localStorage.setItem('cshop_user', JSON.stringify(res.data.user))
        showToast('注册成功')
        window.location.href = '/login'
      } catch (err) {
        showToast(err instanceof Error ? err.message : '注册失败')
      } finally {
        setLoading(false)
      }
    })()
  }

  const socialRegister = (provider: string) => {
    showToast(`正在跳转${provider}注册...`)
  }

  return (
    <main class="min-h-screen flex flex-col md:flex-row">
      {/* Tablet brand side */}
      <div class="hidden md:flex md:w-1/2 relative overflow-hidden items-center justify-center bg-surface-container-low">
        <div class="relative z-10 text-center px-12">
          <h2 class="font-headline text-5xl font-bold text-primary mb-4">ByChooow</h2>
          <p class="text-body-lg text-on-surface-variant">加入创作者社区，开始设计您的专属服饰</p>
        </div>
      </div>

      {/* Form side */}
      <div class="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-12 md:pb-24 relative">
        <header class="md:hidden fixed top-0 w-full bg-surface flex justify-between items-center px-6 h-16 shadow-sm">
          <button
            type="button"
            onClick={() => history.back()}
            class="tap-target text-on-surface-variant hover:opacity-80 transition-opacity"
            aria-label="关闭"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
          <div class="absolute left-1/2 -translate-x-1/2">
            <h1 class="font-headline text-2xl font-bold text-primary tracking-tight">ByChooow</h1>
          </div>
          <div class="w-6"></div>
        </header>

        <div class="w-full max-w-md">
          <div class="text-center mb-10">
            <h2 class="font-headline text-4xl font-bold text-on-surface mb-3 tracking-tight">创建您的风格</h2>
            <p class="text-on-surface-variant text-sm leading-relaxed max-w-xs mx-auto">
              加入创作者社区，开始设计您的专属服饰
            </p>
          </div>

          <div class="bg-surface-container-lowest p-8 rounded-xl shadow-card border border-outline-variant/60">
            <form class="space-y-5" onSubmit={handleSubmit}>
              <div class="space-y-1.5">
                <label class="block text-label-md font-medium text-on-surface-variant ml-1" for="reg-name">全名</label>
                <input
                  id="reg-name"
                  type="text"
                  class={`w-full px-4 py-3 bg-surface rounded-lg border outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors duration-200 text-on-surface placeholder:text-outline ${errors().name ? 'border-error' : 'border-outline-variant'}`}
                  placeholder="您的称呼"
                  value={name()}
                  onInput={(e) => { setName(e.currentTarget.value); setErrors((prev) => ({ ...prev, name: '' })) }}
                />
                {errors().name && <p class="text-error text-xs mt-1 ml-1">{errors().name}</p>}
              </div>

              <div class="space-y-1.5">
                <label class="block text-label-md font-medium text-on-surface-variant ml-1" for="reg-email">邮箱或手机号</label>
                <input
                  id="reg-email"
                  type="text"
                  class={`w-full px-4 py-3 bg-surface rounded-lg border outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors duration-200 text-on-surface placeholder:text-outline ${errors().email ? 'border-error' : 'border-outline-variant'}`}
                  placeholder="example@chooow.com"
                  value={email()}
                  onInput={(e) => { setEmail(e.currentTarget.value); setErrors((prev) => ({ ...prev, email: '' })) }}
                />
                {errors().email && <p class="text-error text-xs mt-1 ml-1">{errors().email}</p>}
              </div>

              <div class="space-y-1.5 relative">
                <label class="block text-label-md font-medium text-on-surface-variant ml-1" for="reg-password">密码</label>
                <input
                  id="reg-password"
                  type={showPassword() ? 'text' : 'password'}
                  class={`w-full px-4 py-3 bg-surface rounded-lg border outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors duration-200 text-on-surface placeholder:text-outline ${errors().password ? 'border-error' : 'border-outline-variant'}`}
                  placeholder="至少 8 位字符"
                  value={password()}
                  onInput={(e) => { setPassword(e.currentTarget.value); setErrors((prev) => ({ ...prev, password: '' })) }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword())}
                  class="absolute right-3 top-[34px] tap-target text-on-surface-variant opacity-60 hover:opacity-100 transition-opacity"
                  aria-label={showPassword() ? '隐藏密码' : '显示密码'}
                >
                  <span class="material-symbols-outlined text-[20px]">{showPassword() ? 'visibility_off' : 'visibility'}</span>
                </button>
                {errors().password && <p class="text-error text-xs mt-1 ml-1">{errors().password}</p>}
              </div>

              <div class="space-y-1.5">
                <label class="block text-label-md font-medium text-on-surface-variant ml-1" for="reg-confirm">确认密码</label>
                <input
                  id="reg-confirm"
                  type="password"
                  class={`w-full px-4 py-3 bg-surface rounded-lg border outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors duration-200 text-on-surface placeholder:text-outline ${errors().confirmPassword ? 'border-error' : 'border-outline-variant'}`}
                  placeholder="再次输入密码"
                  value={confirmPassword()}
                  onInput={(e) => { setConfirmPassword(e.currentTarget.value); setErrors((prev) => ({ ...prev, confirmPassword: '' })) }}
                />
                {errors().confirmPassword && <p class="text-error text-xs mt-1 ml-1">{errors().confirmPassword}</p>}
              </div>

              <div class="flex items-start gap-3 pt-2">
                <div class="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    class={`w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30 transition-colors cursor-pointer ${errors().terms ? 'border-error' : ''}`}
                    checked={agreed()}
                    onChange={(e) => { setAgreed(e.currentTarget.checked); setErrors((prev) => ({ ...prev, terms: '' })) }}
                  />
                </div>
                <label class="text-xs text-on-surface-variant leading-relaxed cursor-pointer select-none" for="terms">
                  我已阅读并同意 <a class="text-primary hover:underline transition-colors" href="#">用户协议</a> 与 <a class="text-primary hover:underline transition-colors" href="#">隐私条款</a>。
                </label>
              </div>
              {errors().terms && <p class="text-error text-xs -mt-3">{errors().terms}</p>}

              <button
                type="submit"
                disabled={loading()}
                class="w-full bg-primary text-on-primary font-bold py-4 rounded-lg shadow-sm hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-opacity transition-transform duration-200 mt-4 tracking-wide tap-target disabled:opacity-60"
              >
                {loading() ? (
                  <span class="flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined animate-spin">progress_activity</span>
                    <span>注册中...</span>
                  </span>
                ) : '注册'}
              </button>
            </form>

            <div class="relative my-8 text-center">
              <div class="absolute inset-0 flex items-center">
                <span class="w-full border-t border-outline-variant opacity-40"></span>
              </div>
              <span class="relative px-4 bg-surface-container-lowest text-label-md text-outline font-medium">或其他注册方式</span>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => socialRegister('Google')}
                class="flex items-center justify-center gap-3 py-3 border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors transition-transform active:scale-95 duration-200 tap-target"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
                <span class="text-xs font-semibold text-on-surface">Google</span>
              </button>
              <button
                type="button"
                onClick={() => socialRegister('Apple')}
                class="flex items-center justify-center gap-3 py-3 border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors transition-transform active:scale-95 duration-200 tap-target"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24"><path d="M17.05 20.28c-.96.95-2.43.95-3.39 0-1.2-1.2-3.39-1.2-4.59 0-.96.95-2.43.95-3.39 0-1.81-1.81-2.43-4.39-1.63-6.61.85-2.36 3.09-3.92 5.6-3.92.54 0 1.07.11 1.57.32.74.31 1.57.31 2.31 0 .5-.21 1.03-.32 1.57-.32 2.51 0 4.75 1.56 5.6 3.92.8 2.22.18 4.8-1.63 6.61z" fill="currentColor"></path><path d="M12 2c-.08 1.43.68 2.78 1.93 3.47.28.15.6.23.93.23.1 0 .21 0 .31-.01.03-1.46-.72-2.83-2-3.52-.3-.16-.63-.24-.96-.24-.07 0-.14.01-.21.07z" fill="currentColor"></path></svg>
                <span class="text-xs font-semibold text-on-surface">Apple</span>
              </button>
            </div>
          </div>

          <div class="mt-8 text-center">
            <p class="text-sm text-on-surface-variant">
              已有账号？ <a class="text-primary font-bold hover:underline underline-offset-4 decoration-primary/30 transition-colors" href="/login">登录</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
