import { createSignal, createMemo } from 'solid-js'
import { showToast } from '../../lib/toast'

export default function ProfileForm() {
  const [nickname, setNickname] = createSignal('ByChooow Design')
  const [gender, setGender] = createSignal<'female' | 'male' | 'secret'>('female')
  const [birthday, setBirthday] = createSignal('1995-08-24')
  const [bio, setBio] = createSignal('在这里发现极简主义之美。Sahara 风格探索者，专注于温润的质感与光影艺术。ByChooow 社区资深创作者。')
  const [saving, setSaving] = createSignal(false)
  const charCount = createMemo(() => bio().length)
  let fileInput: HTMLInputElement | undefined

  const save = () => {
    if (!nickname().trim()) { showToast('昵称不能为空'); return }
    setSaving(true)
    setTimeout(() => { setSaving(false); showToast('保存成功') }, 600)
  }

  const logout = () => {
    if (confirm('确定要退出当前登录吗？')) showToast('已退出登录')
  }

  return (
    <div class="bg-background min-h-screen pb-24 text-on-surface md:pt-16">
      <header class="sticky top-0 md:top-16 z-50 bg-surface h-16 flex items-center justify-between px-4 border-b border-outline-variant">
        <button
          type="button"
          onClick={() => history.back()}
          class="tap-target p-2 hover:bg-surface-container-high rounded-full transition-colors"
          aria-label="返回"
        >
          <span class="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 class="text-lg font-bold text-primary">编辑个人资料</h1>
        <button
          type="button"
          onClick={save}
          disabled={saving()}
          class="text-primary font-semibold text-sm px-4 py-1.5 rounded-lg hover:bg-primary-container transition-colors tap-target disabled:opacity-60"
        >
          {saving() ? '保存中...' : '保存'}
        </button>
      </header>

      <main class="container-content pt-8 space-y-10 pb-24">
        <div class="md:flex md:gap-10 md:items-start">
          <section class="flex flex-col items-center md:w-1/3">
            <button
              type="button"
              onClick={() => fileInput?.click()}
              class="relative group cursor-pointer tap-target"
              aria-label="更换头像"
            >
              <div class="w-28 h-28 rounded-full overflow-hidden border-2 border-primary-container shadow-card bg-primary-container flex items-center justify-center text-primary">
                <span class="material-symbols-outlined text-5xl">person</span>
              </div>
              <div class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="material-symbols-outlined text-white text-2xl">photo_camera</span>
              </div>
              <div class="absolute bottom-0 right-0 bg-primary text-on-primary w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-surface">
                <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">edit</span>
              </div>
            </button>
            <input type="file" accept="image/*" ref={fileInput} class="hidden" />
            <p class="mt-4 text-xs text-on-surface-variant font-medium">点击更换头像</p>
          </section>

          <section class="space-y-6 md:w-2/3">
            <div class="space-y-2">
              <label class="text-label-md font-medium text-on-surface-variant ml-1" for="profile-nickname">昵称</label>
              <input
                id="profile-nickname"
                class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none"
                type="text"
                value={nickname()}
                onInput={(e) => setNickname(e.currentTarget.value)}
              />
            </div>

            <div class="space-y-2">
              <label class="text-label-md font-medium text-on-surface-variant ml-1">性别</label>
              <div class="grid grid-cols-3 gap-3">
                {(['female', 'male', 'secret'] as const).map((g) => (
                  <button
                    type="button"
                    onClick={() => setGender(g)}
                    class={`flex items-center justify-center gap-2 py-3 rounded-lg transition-colors tap-target ${
                      gender() === g
                        ? 'border-2 border-primary bg-primary-container text-primary font-semibold'
                        : 'border border-outline-variant bg-surface text-on-surface-variant hover:border-primary-container'
                    }`}
                    aria-pressed={gender() === g}
                  >
                    <span class="material-symbols-outlined text-lg" style={`font-variation-settings:'FILL' ${gender() === g ? 1 : 0}`}>
                      {g === 'female' ? 'female' : g === 'male' ? 'male' : 'circle'}
                    </span>
                    <span class="text-sm">{g === 'female' ? '女性' : g === 'male' ? '男性' : '保密'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-label-md font-medium text-on-surface-variant ml-1" for="profile-birthday">生日</label>
              <div class="relative">
                <input
                  id="profile-birthday"
                  class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none appearance-none"
                  type="date"
                  value={birthday()}
                  onInput={(e) => setBirthday(e.currentTarget.value)}
                />
                <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">calendar_today</span>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-label-md font-medium text-on-surface-variant ml-1" for="profile-bio">个人简介</label>
              <textarea
                id="profile-bio"
                class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none resize-none"
                placeholder="向世界介绍一下你自己吧..."
                rows="4"
                value={bio()}
                onInput={(e) => e.currentTarget.value.length <= 200 && setBio(e.currentTarget.value)}
              />
              <div class="text-label-md text-right text-on-surface-variant/70">{charCount()} / 200</div>
            </div>

            <a href="/person/address">
              <div
                class="bg-surface-container-low rounded-xl p-5 border border-outline-variant/40 flex items-center justify-between group cursor-pointer hover:bg-surface-container transition-colors shadow-card tap-target"
              >
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-primary">
                    <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">local_shipping</span>
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-on-surface">收货地址管理</h3>
                    <p class="text-xs text-on-surface-variant">管理您的配送地址与默认选项</p>
                  </div>
                </div>
                <span class="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
              </div>
            </a>

            <footer class="pt-8 flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={logout}
                class="text-error font-medium text-sm flex items-center gap-2 px-6 py-2 rounded-full hover:bg-error-container transition-colors tap-target"
              >
                <span class="material-symbols-outlined text-lg">logout</span>退出当前登录
              </button>
              <p class="text-label-md text-on-surface-variant/50">UID: BC88240951 | ByChooow 2.4.0</p>
            </footer>
          </section>
        </div>
      </main>
    </div>
  )
}
