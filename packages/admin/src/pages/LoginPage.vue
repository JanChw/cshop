<template>
  <div
    class="min-h-screen flex items-center justify-center p-6"
    style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 30%, var(--t-primary) 65%, #1e293b 85%, #0f172a 100%);"
  >
    <div class="glass rounded-xl w-[400px] p-8 flex flex-col gap-6 border border-white/10 shadow-2xl">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <span class="text-white font-bold text-lg">C</span>
        </div>
        <div class="flex flex-col">
          <span class="text-text-primary font-bold text-xl">CShop</span>
          <span class="text-xs text-text-muted">后台管理系统</span>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-text-primary">邮箱 / 账号</label>
        <input
          type="text"
          placeholder="admin@cshop.com"
          class="h-10 rounded-lg border border-border/50 px-3 text-sm text-text-primary placeholder:text-text-muted bg-white/30 outline-none focus:border-primary focus:bg-white/50 transition-all"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-text-primary">密码</label>
        <input
          type="password"
          placeholder="••••••••"
          class="h-10 rounded-lg border border-border/50 px-3 text-sm text-text-primary placeholder:text-text-muted bg-white/30 outline-none focus:border-primary focus:bg-white/50 transition-all"
        />
      </div>

      <div class="flex items-center justify-between">
        <label class="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
          <input type="checkbox" class="w-4 h-4 rounded border-border accent-primary" />
          记住登录
        </label>
        <button class="text-sm text-primary hover:underline">忘记密码？</button>
      </div>

      <button class="h-10 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30">
        登录
      </button>

      <p class="text-xs text-text-muted text-center">© 2024 CShop. All rights reserved.</p>
    </div>
  </div>
</template>
