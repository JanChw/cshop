<template>
  <div
    class="min-h-screen flex items-center justify-center p-6"
    style="background: linear-gradient(135deg, var(--color-auth-dark) 0%, var(--color-auth-mid) 30%, var(--t-primary) 65%, var(--color-auth-mid) 85%, var(--color-auth-dark) 100%);"
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

      <div v-if="error" class="rounded-lg bg-danger/10 border border-danger/30 px-3 py-2 text-sm text-danger">
        {{ error }}
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-text-primary">邮箱 / 账号</label>
        <input
          v-model="email"
          type="text"
          placeholder="admin@cshop.com"
          class="h-10 rounded-lg border border-border/50 px-3 text-sm text-text-primary placeholder:text-text-muted bg-white/30 outline-none focus:border-primary focus:bg-white/50 transition-all"
          @keyup.enter="handleLogin"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-text-primary">密码</label>
        <input
          v-model="password"
          type="password"
          placeholder="••••••••"
          class="h-10 rounded-lg border border-border/50 px-3 text-sm text-text-primary placeholder:text-text-muted bg-white/30 outline-none focus:border-primary focus:bg-white/50 transition-all"
          @keyup.enter="handleLogin"
        />
      </div>

      <div class="flex items-center justify-between">
        <label class="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
          <input type="checkbox" v-model="rememberMe" class="w-4 h-4 rounded border-border accent-primary" />
          记住登录
        </label>
        <router-link to="/forgot-password" class="text-sm text-primary hover:underline">忘记密码？</router-link>
      </div>

      <button
        class="h-10 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="loading"
        @click="handleLogin"
      >
        {{ loading ? '登录中...' : '登录' }}
      </button>

      <p class="text-xs text-text-muted text-center">© 2024 CShop. All rights reserved.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { login, isLoggedIn } = useAuth()

const email = ref('')
const password = ref('')
const rememberMe = ref(true)
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = '请输入邮箱和密码'
    return
  }
  loading.value = true
  error.value = ''
  const result = await login(email.value, password.value, rememberMe.value)
  loading.value = false
  if (result.success) {
    router.push('/')
  } else {
    error.value = result.error || '登录失败，请检查邮箱和密码'
  }
}
</script>
