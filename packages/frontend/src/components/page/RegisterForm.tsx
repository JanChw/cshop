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
    if (!email().trim()) errs.email = '请输入邮箱'
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
                <label class="block text-label-md font-medium text-on-surface-variant ml-1" for="reg-email">邮箱</label>
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
