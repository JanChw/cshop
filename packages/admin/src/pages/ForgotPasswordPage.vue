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
          <span class="text-xs text-text-muted">重置密码</span>
        </div>
      </div>

      <div v-if="error" class="rounded-lg bg-danger/10 border border-danger/30 px-3 py-2 text-sm text-danger">
        {{ error }}
      </div>

      <div v-if="!sent" class="flex flex-col gap-5">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-text-primary">邮箱 / 账号</label>
          <p class="text-xs text-text-muted">输入注册时使用的邮箱，我们将向您发送重置密码链接</p>
          <input
            v-model="email"
            type="text"
            placeholder="admin@cshop.com"
            class="h-10 rounded-lg border border-border/50 px-3 text-sm text-text-primary placeholder:text-text-muted bg-white/30 outline-none focus:border-primary focus:bg-white/50 transition-all"
            @keyup.enter="handleForgot"
          />
        </div>

        <button
          class="h-10 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading"
          @click="handleForgot"
        >
          {{ loading ? '发送中...' : '发送重置链接' }}
        </button>

        <div class="flex items-center gap-2 text-sm">
          <span class="text-text-muted">想起密码了？</span>
          <router-link to="/login" class="text-primary hover:underline">返回登录</router-link>
        </div>
      </div>

      <div v-else class="flex flex-col gap-5">
        <div class="flex flex-col gap-2 items-center py-4">
          <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail :size="28" class="text-primary" />
          </div>
          <h2 class="text-base font-semibold text-text-primary">邮件已发送</h2>
          <p class="text-sm text-text-muted text-center">
            如果该邮箱已注册，重置链接将很快送达<br />
            <span class="font-medium text-text-primary">{{ email }}</span>
          </p>
        </div>

        <div class="flex items-center gap-2 text-sm justify-center">
          <span class="text-text-muted">没收到？</span>
          <button class="text-primary hover:underline disabled:opacity-50" :disabled="cooldown > 0" @click="handleResend">
            {{ cooldown > 0 ? `重新发送（${cooldown}s）` : '重新发送' }}
          </button>
        </div>

        <router-link to="/login" class="text-sm text-primary hover:underline text-center">返回登录</router-link>
      </div>

      <p class="text-xs text-text-muted text-center">© 2024 CShop. All rights reserved.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Mail } from 'lucide-vue-next'
import { api } from '@/utils/api'

const email = ref('')
const loading = ref(false)
const error = ref('')
const sent = ref(false)
const cooldown = ref(0)

async function handleForgot() {
  if (!email.value) {
    error.value = '请输入邮箱'
    return
  }
  loading.value = true
  error.value = ''
  const res = await api.post('/auth/forgot-password', { email: email.value })
  loading.value = false
  if (res.success) {
    sent.value = true
    startCooldown()
  } else {
    error.value = res.error || '发送失败，请稍后重试'
  }
}

async function handleResend() {
  if (cooldown.value > 0) return
  loading.value = true
  const res = await api.post('/auth/forgot-password', { email: email.value })
  loading.value = false
  if (res.success) {
    startCooldown()
  } else {
    error.value = res.error || '发送失败'
  }
}

function startCooldown() {
  cooldown.value = 60
  const timer = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0) clearInterval(timer)
  }, 1000)
}
</script>
