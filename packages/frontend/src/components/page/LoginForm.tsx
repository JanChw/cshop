import { createSignal, createEffect, Show, onMount } from 'solid-js'
import { showToast } from '../../lib/toast'
import { api } from '../../lib/api'

type LoginMode = 'password' | 'code'

export default function LoginForm(props: { siteKey: string }) {
  const [mode, setMode] = createSignal<LoginMode>('password')
  const [identifier, setIdentifier] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [showPassword, setShowPassword] = createSignal(false)
  const [rememberMe, setRememberMe] = createSignal(false)
  const [loading, setLoading] = createSignal(false)
  const [errors, setErrors] = createSignal<Record<string, string>>({})

  const [code, setCode] = createSignal('')
  const [sendingCode, setSendingCode] = createSignal(false)
  const [countdown, setCountdown] = createSignal(0)
  const [captchaToken, setCaptchaToken] = createSignal('')
  const [verifiedEmail, setVerifiedEmail] = createSignal('')
  const [needsActivation, setNeedsActivation] = createSignal(false)
  let turnstileRef: HTMLDivElement | undefined

  const emailValid = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier().trim())
  const step2Active = () => mode() === 'code' && emailValid()
  const step3Active = () => mode() === 'code' && emailValid() && !!captchaToken()

  onMount(() => {
    window.onTurnstileSuccess = (token: string) => {
      setCaptchaToken(token)
      setVerifiedEmail(identifier())
    }
    window.onTurnstileExpired = () => setCaptchaToken('')
  })

  createEffect(() => {
    if (step2Active() && turnstileRef && (window as any).turnstile) {
      if (turnstileRef.children.length === 0) {
        ;(window as any).turnstile.render(turnstileRef, {
          sitekey: props.siteKey,
          callback: (token: string) => {
            setCaptchaToken(token)
            setVerifiedEmail(identifier())
          },
          'expired-callback': () => setCaptchaToken(''),
          theme: 'light'
        })
      }
    }
  })

  const validateEmail = () => {
    const errs: Record<string, string> = {}
    if (!identifier().trim()) errs.identifier = '请输入邮箱'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier())) {
      errs.identifier = '邮箱格式不正确'
    }
    return errs
  }

  const validatePassword = () => {
    const errs = validateEmail()
    if (!password()) errs.password = '请输入密码'
    else if (password().length < 6) errs.password = '密码至少 6 位'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateCode = () => {
    const errs = validateEmail()
    if (!code()) errs.code = '请输入验证码'
    else if (!/^\d{6}$/.test(code())) errs.code = '验证码为 6 位数字'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const storeTokens = (data: any) => {
    if (rememberMe() || mode() === 'code') {
      localStorage.setItem('cshop_token', data.accessToken)
      localStorage.setItem('cshop_refresh', data.refreshToken)
      localStorage.setItem('cshop_user', JSON.stringify(data.user))
    } else {
      sessionStorage.setItem('cshop_token', data.accessToken)
      sessionStorage.setItem('cshop_refresh', data.refreshToken)
      sessionStorage.setItem('cshop_user', JSON.stringify(data.user))
      localStorage.removeItem('cshop_token')
      localStorage.removeItem('cshop_refresh')
      localStorage.removeItem('cshop_user')
    }
  }

  const handlePasswordSubmit = (e: Event) => {
    e.preventDefault()
    if (!validatePassword()) return
    setLoading(true)
    setNeedsActivation(false)
    ;(async () => {
      try {
        const res: any = await api.auth.login(identifier(), password(), rememberMe())
        storeTokens(res.data)
        showToast('登录成功')
        window.location.href = '/'
      } catch (err) {
        const msg = err instanceof Error ? err.message : '登录失败'
        if (msg.includes('未激活')) {
          setNeedsActivation(true)
          showToast(msg)
        } else {
          showToast(msg)
        }
      } finally {
        setLoading(false)
      }
    })()
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

  const handleSendCode = () => {
    const errs = validateEmail()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    if (!captchaToken()) {
      showToast('请先完成人机验证')
      return
    }

    setSendingCode(true)
    ;(async () => {
      try {
        await api.auth.sendEmailCode(identifier(), captchaToken())
        showToast('验证码已发送至您的邮箱')
        startCountdown(60)
      } catch (err) {
        showToast(err instanceof Error ? err.message : '发送失败')
        startCountdown(3)
      } finally {
        setSendingCode(false)
      }
    })()
  }

  const handleCodeSubmit = (e: Event) => {
    e.preventDefault()
    if (!validateCode()) return
    setLoading(true)
    ;(async () => {
      try {
        const res: any = await api.auth.emailCodeLogin(identifier(), code())
        storeTokens(res.data)
        showToast('登录成功')
        window.location.href = '/'
      } catch (err) {
        showToast(err instanceof Error ? err.message : '登录失败')
      } finally {
        setLoading(false)
      }
    })()
  }

  const resetCaptcha = () => {
    setCaptchaToken('')
    setVerifiedEmail('')
    if ((window as any).turnstile && turnstileRef) {
      ;(window as any).turnstile.reset(turnstileRef)
    }
  }

  const StepBadge = (props: { n: number, state: 'done' | 'active' | 'pending' }) => (
    <span class={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 transition-all duration-300 ${
      props.state === 'done' ? 'bg-primary text-on-primary' :
      props.state === 'active' ? 'bg-primary text-on-primary' :
      'bg-surface-container-high text-outline border border-outline-variant'
    }`}>
      {props.state === 'done' ? <span class="material-symbols-outlined text-base">check</span> : props.n}
    </span>
  )

  return (
    <main class="min-h-screen flex flex-col md:flex-row md:h-screen md:overflow-hidden">
      {/* Tablet brand side */}
      <div class="hidden md:flex md:w-1/2 shrink-0 relative overflow-hidden items-center justify-center bg-surface-container-low">
        <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
        <div class="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-tertiary/5 rounded-full blur-[80px]" />
        <div class="relative z-10 text-center px-12">
          <h2 class="font-headline text-5xl font-bold text-primary mb-4">ByChooow</h2>
          <p class="text-body-lg text-on-surface-variant">将你的创意，转化为高级成衣</p>
        </div>
      </div>

      {/* Form side */}
      <div class="flex-1 flex flex-col items-center px-6 py-24 pb-32 md:pb-24 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden relative">
        <div class="md:hidden fixed top-0 w-full flex justify-center items-center h-20 bg-transparent">
          <h1 class="font-headline text-3xl font-bold text-primary tracking-tight">ByChooow</h1>
        </div>

        <div class="w-full max-w-md my-auto">
          <div class="text-center mb-10 space-y-2">
            <h2 class="font-headline text-4xl text-on-surface font-semibold">欢迎回来</h2>
            <p class="text-on-surface-variant text-sm">登录以继续您的创意之旅</p>
          </div>

          <div class="bg-surface-container-low p-8 rounded-lg shadow-card border border-outline-variant/60">
            <div class="flex mb-8 border-b border-outline-variant/60">
              <button
                type="button"
                onClick={() => { setMode('password'); setErrors({}); setCode('') }}
                class={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${mode() === 'password' ? 'border-primary text-primary' : 'border-transparent text-outline hover:text-on-surface-variant'}`}
              >
                密码登录
              </button>
              <button
                type="button"
                onClick={() => { setMode('code'); setErrors({}); resetCaptcha() }}
                class={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${mode() === 'code' ? 'border-primary text-primary' : 'border-transparent text-outline hover:text-on-surface-variant'}`}
              >
                验证码登录
              </button>
            </div>

            <Show when={mode() === 'password'}>
              <form class="space-y-6" onSubmit={handlePasswordSubmit}>
                <div class="space-y-2">
                  <label class="block text-label-md font-medium text-on-surface-variant ml-1" for="identifier">邮箱</label>
                  <div class="relative group">
                    <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">mail</span>
                    <input
                      id="identifier"
                      type="text"
                      class={`w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors placeholder:text-outline/60 ${errors().identifier ? 'border-error' : 'border-outline-variant'}`}
                      placeholder="输入您的邮箱"
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
                      class={`w-full pl-12 pr-12 py-3.5 bg-surface-container-lowest border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors placeholder:text-outline/60 ${errors().password ? 'border-error' : 'border-outline-variant'}`}
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

                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe()}
                    onChange={(e) => setRememberMe(e.currentTarget.checked)}
                    class="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <label for="rememberMe" class="text-sm text-on-surface-variant cursor-pointer select-none">记住我</label>
                </div>

                <button
                  type="submit"
                  disabled={loading()}
                  class="w-full bg-primary text-on-primary py-4 px-6 rounded-lg font-bold tracking-wide flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-opacity transition-transform duration-200 group shadow-lg shadow-primary/10 tap-target disabled:opacity-60"
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

                <Show when={needsActivation()}>
                  <div class="flex items-start gap-3 p-4 bg-tertiary-container/40 border border-tertiary/30 rounded-lg">
                    <span class="material-symbols-outlined text-tertiary mt-0.5">mark_email_unread</span>
                    <div class="flex-1">
                      <p class="text-sm text-on-surface leading-relaxed">
                        邮箱未激活，请查收激活邮件。未收到？可前往
                        <a href="/register" class="text-primary font-bold hover:underline underline-offset-4 transition-colors">注册页</a>
                        重新发送激活邮件。
                      </p>
                    </div>
                  </div>
                </Show>
              </form>
            </Show>

            <Show when={mode() === 'code'}>
              <form class="space-y-5" onSubmit={handleCodeSubmit}>
                {/* Step 1: 输入邮箱 */}
                <div class="space-y-2">
                  <div class="flex items-center gap-2.5">
                    <StepBadge n={1} state={emailValid() ? 'done' : 'active'} />
                    <label class="text-sm font-semibold text-on-surface" for="code-email">输入邮箱</label>
                  </div>
                  <div class="relative group ml-9">
                    <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">mail</span>
                    <input
                      id="code-email"
                      type="text"
                      class={`w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors placeholder:text-outline/60 ${errors().identifier ? 'border-error' : emailValid() ? 'border-primary/50' : 'border-outline-variant'}`}
                      placeholder="输入您的邮箱"
                      value={identifier()}
                      onInput={(e) => {
                        const val = e.currentTarget.value
                        setIdentifier(val)
                        setErrors((prev) => ({ ...prev, identifier: '' }))
                        if (val !== verifiedEmail() && captchaToken()) {
                          resetCaptcha()
                        }
                      }}
                    />
                  </div>
                  {errors().identifier && <p class="text-error text-xs mt-1 ml-9">{errors().identifier}</p>}
                </div>

                {/* Step 2: 人机验证 */}
                <Show when={step2Active()}>
                  <div class="space-y-2">
                    <div class="flex items-center gap-2.5">
                      <StepBadge n={2} state={captchaToken() ? 'done' : 'active'} />
                      <label class="text-sm font-semibold text-on-surface">人机验证</label>
                    </div>
                    <div class="ml-9 bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex justify-center">
                      <div ref={turnstileRef} class="min-h-[65px]" />
                    </div>
                  </div>
                </Show>

                {/* Step 3: 输入验证码 */}
                <Show when={step3Active()}>
                  <div class="space-y-2">
                    <div class="flex items-center gap-2.5">
                      <StepBadge n={3} state="active" />
                      <label class="text-sm font-semibold text-on-surface" for="code">输入验证码</label>
                    </div>
                    <div class="flex gap-3 ml-9">
                      <input
                        id="code"
                        type="text"
                        inputmode="numeric"
                        maxlength="6"
                        class={`w-full px-4 py-3.5 bg-surface-container-lowest border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors placeholder:text-outline/60 text-center tracking-[0.5em] ${errors().code ? 'border-error' : 'border-outline-variant'}`}
                        placeholder="6 位验证码"
                        value={code()}
                        onInput={(e) => { setCode(e.currentTarget.value.replace(/\D/g, '').slice(0, 6)); setErrors((prev) => ({ ...prev, code: '' })) }}
                      />
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={sendingCode() || countdown() > 0}
                        class={`shrink-0 px-5 py-3.5 rounded-lg border text-sm font-semibold transition-colors tap-target disabled:opacity-50 disabled:cursor-not-allowed ${!sendingCode() && countdown() <= 0 ? 'border-primary text-primary hover:bg-primary/5 active:scale-95' : 'border-outline-variant text-on-surface-variant'}`}
                      >
                        {countdown() > 0 ? `${countdown()}s` : sendingCode() ? '发送中' : '发送验证码'}
                      </button>
                    </div>
                    {errors().code && <p class="text-error text-xs mt-1 ml-9">{errors().code}</p>}
                  </div>
                </Show>

                <button
                  type="submit"
                  disabled={loading() || !step3Active()}
                  class="w-full bg-primary text-on-primary py-4 px-6 rounded-lg font-bold tracking-wide hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-opacity transition-transform duration-200 shadow-lg shadow-primary/10 tap-target disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Show when={!loading()}>
                    <span>登录</span>
                  </Show>
                  <Show when={loading()}>
                    <span class="material-symbols-outlined animate-spin">progress_activity</span>
                    <span>登录中...</span>
                  </Show>
                </button>
              </form>
            </Show>
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
