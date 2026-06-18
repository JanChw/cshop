import { createSignal, Show } from 'solid-js'
import { showToast } from '../../lib/toast'

export default function LoginForm() {
  const [identifier, setIdentifier] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [showPassword, setShowPassword] = createSignal(false)
  const [loading, setLoading] = createSignal(false)
  const [errors, setErrors] = createSignal<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!identifier().trim()) errs.identifier = '请输入邮箱或手机号'
    else if (identifier().includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier())) {
      errs.identifier = '邮箱格式不正确'
    }
    if (!password()) errs.password = '请输入密码'
    else if (password().length < 6) errs.password = '密码至少 6 位'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      showToast('登录成功')
      setTimeout(() => { window.location.href = '/' }, 800)
    }, 1200)
  }

  const socialLogin = (provider: string) => {
    showToast(`正在跳转${provider}登录...`)
  }

  return (
    <main class="min-h-screen flex flex-col md:flex-row">
      {/* Tablet brand side */}
      <div class="hidden md:flex md:w-1/2 relative overflow-hidden items-center justify-center bg-surface-container-low">
        <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
        <div class="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-tertiary/5 rounded-full blur-[80px]" />
        <div class="relative z-10 text-center px-12">
          <h2 class="font-headline text-5xl font-bold text-primary mb-4">ByChooow</h2>
          <p class="text-body-lg text-on-surface-variant">将你的创意，转化为高级成衣</p>
        </div>
      </div>

      {/* Form side */}
      <div class="flex-1 flex flex-col items-center justify-center px-6 py-24 pb-32 md:pb-24 relative">
        <div class="md:hidden fixed top-0 w-full flex justify-center items-center h-20 bg-transparent">
          <h1 class="font-headline text-3xl font-bold text-primary tracking-tight">ByChooow</h1>
        </div>

        <div class="w-full max-w-md">
          <div class="text-center mb-10 space-y-2">
            <h2 class="font-headline text-4xl text-on-surface font-semibold">欢迎回来</h2>
            <p class="text-on-surface-variant text-sm">登录以继续您的创意之旅</p>
          </div>

          <div class="bg-surface-container-low p-8 rounded-lg shadow-card border border-outline-variant/60">
            <form class="space-y-6" onSubmit={handleSubmit}>
              <div class="space-y-2">
                <label class="block text-label-md font-medium text-on-surface-variant ml-1" for="identifier">邮箱 / 手机号</label>
                <div class="relative group">
                  <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">mail</span>
                  <input
                    id="identifier"
                    type="text"
                    class={`w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-outline/60 ${errors().identifier ? 'border-error' : 'border-outline-variant'}`}
                    placeholder="输入您的联系方式"
                    value={identifier()}
                    onInput={(e) => { setIdentifier(e.currentTarget.value); setErrors((prev) => ({ ...prev, identifier: '' })) }}
                  />
                </div>
                {errors().identifier && <p class="text-error text-xs mt-1 ml-1">{errors().identifier}</p>}
              </div>

              <div class="space-y-2">
                <div class="flex justify-between items-end">
                  <label class="block text-label-md font-medium text-on-surface-variant ml-1" for="password">密码</label>
                  <a class="text-xs font-semibold text-primary hover:opacity-80 transition-opacity" href="#">忘记密码？</a>
                </div>
                <div class="relative group">
                  <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock</span>
                  <input
                    id="password"
                    type={showPassword() ? 'text' : 'password'}
                    class={`w-full pl-12 pr-12 py-3.5 bg-surface-container-lowest border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-outline/60 ${errors().password ? 'border-error' : 'border-outline-variant'}`}
                    placeholder="输入您的密码"
                    value={password()}
                    onInput={(e) => { setPassword(e.currentTarget.value); setErrors((prev) => ({ ...prev, password: '' })) }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword())}
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors tap-target"
                    aria-label={showPassword() ? '隐藏密码' : '显示密码'}
                  >
                    <span class="material-symbols-outlined">{showPassword() ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {errors().password && <p class="text-error text-xs mt-1 ml-1">{errors().password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading()}
                class="w-full bg-primary text-on-primary py-4 px-6 rounded-lg font-bold tracking-wide flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all group shadow-lg shadow-primary/10 tap-target disabled:opacity-60"
              >
                <Show when={!loading()}>
                  <span>登录</span>
                  <span class="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Show>
                <Show when={loading()}>
                  <span class="material-symbols-outlined animate-spin">progress_activity</span>
                  <span>登录中...</span>
                </Show>
              </button>
            </form>

            <div class="mt-10">
              <div class="relative flex items-center mb-8">
                <div class="flex-grow border-t border-outline-variant/60"></div>
                <span class="flex-shrink mx-4 text-xs font-medium text-outline">使用其他方式登录</span>
                <div class="flex-grow border-t border-outline-variant/60"></div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => socialLogin('微信')}
                  class="flex items-center justify-center gap-3 py-3 px-4 border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors group tap-target"
                >
                  <div class="w-6 h-6 flex items-center justify-center bg-[#07C160] rounded-full">
                    <span class="material-symbols-outlined text-on-primary text-base" style="font-variation-settings: 'FILL' 1">chat</span>
                  </div>
                  <span class="text-sm font-semibold text-on-surface-variant">微信</span>
                </button>
                <button
                  type="button"
                  onClick={() => socialLogin('QQ')}
                  class="flex items-center justify-center gap-3 py-3 px-4 border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors group tap-target"
                >
                  <div class="w-6 h-6 flex items-center justify-center bg-[#12B7F5] rounded-full">
                    <span class="material-symbols-outlined text-on-primary text-base" style="font-variation-settings: 'FILL' 1">person</span>
                  </div>
                  <span class="text-sm font-semibold text-on-surface-variant">QQ</span>
                </button>
              </div>
            </div>
          </div>

          <p class="mt-8 text-center text-on-surface-variant text-sm font-medium">
            还没有账号？
            <a class="text-primary font-bold hover:underline decoration-2 underline-offset-4" href="/register">立即注册</a>
          </p>
        </div>
      </div>
    </main>
  )
}
