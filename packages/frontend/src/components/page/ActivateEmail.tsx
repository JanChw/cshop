import { createSignal, onMount, Show } from 'solid-js'
import { api } from '../../lib/api'
import { showToast } from '../../lib/toast'

export default function ActivateEmail(props: { token: string }) {
  const [status, setStatus] = createSignal<'loading' | 'success' | 'error'>('loading')
  const [email, setEmail] = createSignal('')
  const [errorMsg, setErrorMsg] = createSignal('')

  onMount(() => {
    if (!props.token) {
      setStatus('error')
      setErrorMsg('激活链接缺少 token 参数')
      return
    }
    ;(async () => {
      try {
        const res = await api.auth.activateEmail(props.token)
        if (res.success) {
          setStatus('success')
          setEmail(res.data.email)
          showToast('邮箱激活成功')
        } else {
          setStatus('error')
          setErrorMsg('激活失败，请重试')
        }
      } catch (err) {
        setStatus('error')
        setErrorMsg(err instanceof Error ? err.message : '激活失败')
      }
    })()
  })

  return (
    <main class="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="font-headline text-3xl font-bold text-primary tracking-tight mb-2">ByChooow</h1>
        </div>

        <div class="bg-surface-container-lowest p-8 rounded-xl shadow-card border border-outline-variant/60 text-center">
          <Show when={status() === 'loading'}>
            <div class="flex flex-col items-center gap-4 py-6">
              <span class="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
              <p class="text-on-surface-variant text-sm">正在激活您的邮箱...</p>
            </div>
          </Show>

          <Show when={status() === 'success'}>
            <div class="flex flex-col items-center gap-4 py-4">
              <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-container text-on-primary-container">
                <span class="material-symbols-outlined text-5xl">check_circle</span>
              </div>
              <h2 class="font-headline text-2xl font-bold text-on-surface">邮箱激活成功</h2>
              <p class="text-on-surface-variant text-sm leading-relaxed">
                <span class="font-bold text-on-surface">{email()}</span> 已成功激活，您现在可以登录账号了。
              </p>
              <a
                href="/login"
                class="w-full mt-2 bg-primary text-on-primary font-bold py-3.5 rounded-lg hover:opacity-90 active:scale-[0.98] transition-opacity transition-transform tap-target"
              >
                前往登录
              </a>
            </div>
          </Show>

          <Show when={status() === 'error'}>
            <div class="flex flex-col items-center gap-4 py-4">
              <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-error-container text-on-error-container">
                <span class="material-symbols-outlined text-5xl">cancel</span>
              </div>
              <h2 class="font-headline text-2xl font-bold text-on-surface">激活失败</h2>
              <p class="text-on-surface-variant text-sm leading-relaxed">{errorMsg()}</p>
              <a
                href="/register"
                class="w-full mt-2 bg-primary text-on-primary font-bold py-3.5 rounded-lg hover:opacity-90 active:scale-[0.98] transition-opacity transition-transform tap-target"
              >
                返回注册
              </a>
            </div>
          </Show>
        </div>

        <p class="mt-6 text-center text-on-surface-variant text-xs">
          如需帮助，请检查激活链接是否完整或重新发送激活邮件
        </p>
      </div>
    </main>
  )
}
