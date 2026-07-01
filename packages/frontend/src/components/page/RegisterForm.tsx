import { createSignal, createEffect, Show, onMount } from 'solid-js'
import { showToast } from '../../lib/toast'
import { api } from '../../lib/api'

export default function RegisterForm(props: { siteKey: string }) {
  const [name, setName] = createSignal('')
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [confirmPassword, setConfirmPassword] = createSignal('')
  const [agreed, setAgreed] = createSignal(false)
  const [showPassword, setShowPassword] = createSignal(false)
  const [loading, setLoading] = createSignal(false)
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [captchaToken, setCaptchaToken] = createSignal('')
  let turnstileRef: HTMLDivElement | undefined

  const [submitted, setSubmitted] = createSignal(false)
  const [resending, setResending] = createSignal(false)
  const [resendCaptchaToken, setResendCaptchaToken] = createSignal('')
  const [countdown, setCountdown] = createSignal(0)
  let resendTurnstileRef: HTMLDivElement | undefined

  onMount(() => {
    window.onTurnstileSuccess = (token: string) => {
      if (submitted()) setResendCaptchaToken(token)
      else setCaptchaToken(token)
    }
    window.onTurnstileExpired = () => {
      setCaptchaToken('')
      setResendCaptchaToken('')
    }
  })

  createEffect(() => {
    if (showCaptcha() && turnstileRef && (window as any).turnstile) {
      if (turnstileRef.children.length === 0) {
        ;(window as any).turnstile.render(turnstileRef, {
          sitekey: props.siteKey,
          callback: (token: string) => setCaptchaToken(token),
          'expired-callback': () => setCaptchaToken(''),
          theme: 'light'
        })
      }
    }
  })

  createEffect(() => {
    if (submitted() && countdown() === 0 && resendTurnstileRef && (window as any).turnstile) {
      if (resendTurnstileRef.children.length === 0) {
        ;(window as any).turnstile.render(resendTurnstileRef, {
          sitekey: props.siteKey,
          callback: (token: string) => setResendCaptchaToken(token),
          'expired-callback': () => setResendCaptchaToken(''),
          theme: 'light'
        })
      }
    }
  })

  const formValid = () => {
    return !!(
      name().trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email().trim()) &&
      password().length >= 8 &&
      password() === confirmPassword() &&
      agreed()
    )
  }

  const showCaptcha = () => formValid()

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name().trim()) errs.name = '请输入姓名'
    if (!email().trim()) errs.email = '请输入邮箱'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email())) errs.email = '邮箱格式不正确'
    if (!password()) errs.password = '请输入密码'
    else if (password().length < 8) errs.password = '密码至少 8 位'
    if (password() !== confirmPassword()) errs.confirmPassword = '两次密码不一致'
    if (!agreed()) errs.terms = '请先同意用户协议'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const startCountdown = (seconds: number) => {
    setCountdown(seconds)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    if (!validate()) return

    if (!captchaToken()) {
      showToast('请先完成人机验证')
      return
    }

    setLoading(true)
    ;(async () => {
      try {
        await api.auth.register(name(), email(), password(), captchaToken())
        setSubmitted(true)
        showToast('注册成功，请查收激活邮件')
      } catch (err) {
        showToast(err instanceof Error ? err.message : '注册失败')
        if (turnstileRef && (window as any).turnstile) {
          ;(window as any).turnstile.reset(turnstileRef)
        }
        setCaptchaToken('')
      } finally {
        setLoading(false)
      }
    })()
  }

  const handleResend = () => {
    if (countdown() > 0) return
    if (!resendCaptchaToken()) {
      showToast('请先完成人机验证')
      return
    }
    setResending(true)
    ;(async () => {
      try {
        await api.auth.resendActivation(email(), resendCaptchaToken())
        showToast('激活邮件已重新发送')
        startCountdown(60)
        setResendCaptchaToken('')
        if (resendTurnstileRef && (window as any).turnstile) {
          ;(window as any).turnstile.reset(resendTurnstileRef)
        }
      } catch (err) {
        showToast(err instanceof Error ? err.message : '发送失败')
      } finally {
        setResending(false)
      }
    })()
  }

  return (
    <main class="min-h-screen flex flex-col md:flex-row md:h-screen md:overflow-hidden">
      {/* Tablet brand side */}
      <div class="hidden md:flex md:w-1/2 shrink-0 relative overflow-hidden items-center justify-center bg-surface-container-low">
        <div class="relative z-10 text-center px-12">
          <h2 class="font-headline text-5xl font-bold text-primary mb-4">ByChooow</h2>
          <p class="text-body-lg text-on-surface-variant">加入创作者社区，开始设计您的专属服饰</p>
        </div>
      </div>

      {/* Form side */}
      <div class="flex-1 flex flex-col items-center px-4 pt-36 pb-8 md:pt-24 md:pb-24 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden relative">
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

        <div class="w-full max-w-md md:my-auto">
          <Show when={submitted()} fallback={
            <>
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

                  {/* 人机验证 */}
                  <Show when={showCaptcha()}>
                    <div class="space-y-1.5">
                      <label class="block text-label-md font-medium text-on-surface-variant ml-1">人机验证</label>
                      <div class="bg-surface border border-outline-variant rounded-lg p-4 flex justify-center">
                        <div ref={turnstileRef} class="min-h-[65px]" />
                      </div>
                    </div>
                  </Show>

                  <button
                    type="submit"
                    disabled={loading() || (showCaptcha() && !captchaToken())}
                    class="w-full bg-primary text-on-primary font-bold py-4 rounded-lg shadow-sm hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-opacity transition-transform duration-200 mt-4 tracking-wide tap-target disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading() ? (
                      <span class="flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined animate-spin">progress_activity</span>
                        <span>注册中...</span>
                      </span>
                    ) : showCaptcha() && !captchaToken() ? '请先完成人机验证' : '注册'}
                  </button>
                </form>
              </div>

              <div class="mt-8 text-center">
                <p class="text-sm text-on-surface-variant">
                  已有账号？ <a class="text-primary font-bold hover:underline underline-offset-4 decoration-primary/30 transition-colors" href="/login">登录</a>
                </p>
              </div>
            </>
          }>
            {/* 注册成功 — 邮箱激活提示 */}
            <div class="text-center mb-10">
              <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-container text-on-primary-container mb-6">
                <span class="material-symbols-outlined text-5xl">mark_email_unread</span>
              </div>
              <h2 class="font-headline text-3xl font-bold text-on-surface mb-3 tracking-tight">验证您的邮箱</h2>
              <p class="text-on-surface-variant text-sm leading-relaxed max-w-xs mx-auto">
                我们已向 <span class="font-bold text-on-surface">{email()}</span> 发送了一封激活邮件，请点击邮件中的链接完成激活。
              </p>
            </div>

            <div class="bg-surface-container-lowest p-8 rounded-xl shadow-card border border-outline-variant/60 space-y-6">
              <div class="flex items-start gap-3">
                <span class="material-symbols-outlined text-primary mt-0.5">info</span>
                <p class="text-sm text-on-surface-variant leading-relaxed">
                  激活链接 30 分钟内有效。若未收到邮件，请检查垃圾邮件文件夹，或点击下方按钮重新发送。
                </p>
              </div>

              {/* 重新发送激活邮件 */}
              <Show when={countdown() === 0}>
                <div class="space-y-3">
                  <div class="bg-surface border border-outline-variant rounded-lg p-4 flex justify-center">
                    <div ref={resendTurnstileRef} class="min-h-[65px]" />
                  </div>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending() || !resendCaptchaToken()}
                    class="w-full bg-primary text-on-primary font-bold py-3.5 rounded-lg hover:opacity-90 active:scale-[0.98] transition-opacity transition-transform tap-target disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resending() ? (
                      <span class="flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined animate-spin">progress_activity</span>
                        <span>发送中...</span>
                      </span>
                    ) : '重新发送激活邮件'}
                  </button>
                </div>
              </Show>
              <Show when={countdown() > 0}>
                <button
                  type="button"
                  disabled
                  class="w-full bg-surface-container-low text-on-surface-variant font-bold py-3.5 rounded-lg cursor-not-allowed"
                >
                  {countdown()}s 后可重新发送
                </button>
              </Show>

              <a href="/login" class="block w-full text-center py-3 text-sm font-bold text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors tap-target">
                返回登录
              </a>
            </div>
          </Show>
        </div>
      </div>
    </main>
  )
}
