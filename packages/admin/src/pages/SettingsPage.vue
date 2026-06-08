<template>
  <div class="p-6 flex flex-col gap-5 min-h-screen">
    <h1 class="text-xl font-bold text-text-primary">系统设置</h1>

    <div class="flex gap-6 flex-1 min-h-0">
      <div class="w-[110px] flex flex-col gap-1 shrink-0">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="rounded px-4 py-2.5 text-sm text-center transition-colors w-full"
          :class="activeTab === tab.key
            ? 'bg-primary text-white font-medium'
            : 'text-text-primary hover:bg-gray-100'"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="flex-1 bg-card border border-border rounded-md px-8 py-6 flex flex-col gap-6 min-w-0 overflow-auto">
        <template v-if="activeTab === 'basic'">
          <div>
            <h2 class="text-base font-semibold text-text-primary">基本设置</h2>
            <p class="text-sm text-text-muted mt-1">配置系统的基本参数</p>
          </div>

          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">商品数据保留天数</label>
              <p class="text-xs text-text-muted">超过此天数的商品活动数据将被清理</p>
              <div class="flex items-center gap-2">
                <input
                  v-model="basicForm.retentionDays"
                  type="number"
                  class="w-[300px] h-9 rounded border border-border px-3 text-sm text-text-primary font-mono outline-none focus:border-primary transition-colors"
                />
                <span class="text-sm text-text-muted">天</span>
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">站点名称</label>
              <input
                v-model="basicForm.siteName"
                type="text"
                class="w-[400px] h-9 rounded border border-border px-3 text-sm text-text-primary outline-none focus:border-primary transition-colors"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">联系邮箱</label>
              <input
                v-model="basicForm.email"
                type="email"
                class="w-[400px] h-9 rounded border border-border px-3 text-sm text-text-primary outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button class="rounded px-5 py-2.5 text-sm font-medium text-white bg-primary flex items-center gap-2 hover:bg-primary/90 transition-colors">
              <Check :size="16" />
              保存设置
            </button>
            <button class="rounded px-5 py-2.5 text-sm font-medium text-text-primary border border-border flex items-center gap-2 hover:bg-gray-50 transition-colors">
              <RotateCcw :size="16" />
              重置
            </button>
          </div>
        </template>

        <template v-if="activeTab === 'security'">
          <div>
            <h2 class="text-base font-semibold text-text-primary">安全设置</h2>
            <p class="text-sm text-text-muted mt-1">管理账户安全和登录策略</p>
          </div>

          <div class="flex flex-col gap-5">
            <div class="flex items-center justify-between py-3 border-b border-border">
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-medium text-text-primary">修改密码</span>
                <span class="text-xs text-text-muted">定期修改密码以保障账户安全</span>
              </div>
              <button class="h-9 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors">
                修改
              </button>
            </div>

            <div class="flex items-center justify-between py-3 border-b border-border">
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-medium text-text-primary">登录失败锁定</span>
                <span class="text-xs text-text-muted">连续登录失败 5 次后锁定账户 30 分钟</span>
              </div>
              <div
                class="w-10 h-6 rounded-full cursor-pointer transition-colors relative"
                :class="securityForm.loginLock ? 'bg-primary' : 'bg-gray-300'"
                @click="securityForm.loginLock = !securityForm.loginLock"
              >
                <div
                  class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                  :class="securityForm.loginLock ? 'translate-x-4.5' : 'translate-x-0.5'"
                />
              </div>
            </div>

            <div class="flex items-center justify-between py-3 border-b border-border">
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-medium text-text-primary">会话超时</span>
                <span class="text-xs text-text-muted">超过指定时间未操作将自动退出登录</span>
              </div>
              <select
                v-model="securityForm.sessionTimeout"
                class="h-9 rounded border border-border px-3 text-sm text-text-primary bg-white outline-none appearance-none cursor-pointer"
              >
                <option value="15">15 分钟</option>
                <option value="30">30 分钟</option>
                <option value="60">1 小时</option>
                <option value="120">2 小时</option>
              </select>
            </div>

            <div class="flex items-center justify-between py-3 border-b border-border">
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-medium text-text-primary">IP 白名单</span>
                <span class="text-xs text-text-muted">仅允许指定 IP 地址访问后台</span>
              </div>
              <div
                class="w-10 h-6 rounded-full cursor-pointer transition-colors relative"
                :class="securityForm.ipWhitelist ? 'bg-primary' : 'bg-gray-300'"
                @click="securityForm.ipWhitelist = !securityForm.ipWhitelist"
              >
                <div
                  class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                  :class="securityForm.ipWhitelist ? 'translate-x-4.5' : 'translate-x-0.5'"
                />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">密码最小长度</label>
              <p class="text-xs text-text-muted">新密码必须满足此长度要求</p>
              <div class="flex items-center gap-2">
                <input
                  v-model="securityForm.minPasswordLength"
                  type="number"
                  min="6"
                  max="32"
                  class="w-[300px] h-9 rounded border border-border px-3 text-sm text-text-primary font-mono outline-none focus:border-primary transition-colors"
                />
                <span class="text-sm text-text-muted">位</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button class="rounded px-5 py-2.5 text-sm font-medium text-white bg-primary flex items-center gap-2 hover:bg-primary/90 transition-colors">
              <Check :size="16" />
              保存设置
            </button>
          </div>
        </template>

        <template v-if="activeTab === 'notification'">
          <div>
            <h2 class="text-base font-semibold text-text-primary">通知设置</h2>
            <p class="text-sm text-text-muted mt-1">管理系统通知和提醒方式</p>
          </div>

          <div class="flex flex-col gap-5">
            <div class="flex items-center justify-between py-3 border-b border-border">
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-medium text-text-primary">新订单通知</span>
                <span class="text-xs text-text-muted">有新订单时发送通知提醒</span>
              </div>
              <div
                class="w-10 h-6 rounded-full cursor-pointer transition-colors relative"
                :class="notifyForm.newOrder ? 'bg-primary' : 'bg-gray-300'"
                @click="notifyForm.newOrder = !notifyForm.newOrder"
              >
                <div
                  class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                  :class="notifyForm.newOrder ? 'translate-x-4.5' : 'translate-x-0.5'"
                />
              </div>
            </div>

            <div class="flex items-center justify-between py-3 border-b border-border">
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-medium text-text-primary">库存预警</span>
                <span class="text-xs text-text-muted">商品库存低于阈值时发送预警</span>
              </div>
              <div
                class="w-10 h-6 rounded-full cursor-pointer transition-colors relative"
                :class="notifyForm.stockAlert ? 'bg-primary' : 'bg-gray-300'"
                @click="notifyForm.stockAlert = !notifyForm.stockAlert"
              >
                <div
                  class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                  :class="notifyForm.stockAlert ? 'translate-x-4.5' : 'translate-x-0.5'"
                />
              </div>
            </div>

            <div class="flex items-center justify-between py-3 border-b border-border">
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-medium text-text-primary">用户注册通知</span>
                <span class="text-xs text-text-muted">有新用户注册时发送通知</span>
              </div>
              <div
                class="w-10 h-6 rounded-full cursor-pointer transition-colors relative"
                :class="notifyForm.userRegister ? 'bg-primary' : 'bg-gray-300'"
                @click="notifyForm.userRegister = !notifyForm.userRegister"
              >
                <div
                  class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                  :class="notifyForm.userRegister ? 'translate-x-4.5' : 'translate-x-0.5'"
                />
              </div>
            </div>

            <div class="flex items-center justify-between py-3 border-b border-border">
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-medium text-text-primary">邮件通知</span>
                <span class="text-xs text-text-muted">通过邮件发送系统通知</span>
              </div>
              <div
                class="w-10 h-6 rounded-full cursor-pointer transition-colors relative"
                :class="notifyForm.emailNotify ? 'bg-primary' : 'bg-gray-300'"
                @click="notifyForm.emailNotify = !notifyForm.emailNotify"
              >
                <div
                  class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                  :class="notifyForm.emailNotify ? 'translate-x-4.5' : 'translate-x-0.5'"
                />
              </div>
            </div>

            <div class="flex items-center justify-between py-3 border-b border-border">
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-medium text-text-primary">短信通知</span>
                <span class="text-xs text-text-muted">通过短信发送重要通知</span>
              </div>
              <div
                class="w-10 h-6 rounded-full cursor-pointer transition-colors relative"
                :class="notifyForm.smsNotify ? 'bg-primary' : 'bg-gray-300'"
                @click="notifyForm.smsNotify = !notifyForm.smsNotify"
              >
                <div
                  class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                  :class="notifyForm.smsNotify ? 'translate-x-4.5' : 'translate-x-0.5'"
                />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">通知接收邮箱</label>
              <input
                v-model="notifyForm.notifyEmail"
                type="email"
                placeholder="admin@cshop.com"
                class="w-[400px] h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button class="rounded px-5 py-2.5 text-sm font-medium text-white bg-primary flex items-center gap-2 hover:bg-primary/90 transition-colors">
              <Check :size="16" />
              保存设置
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Check, RotateCcw } from 'lucide-vue-next'

const activeTab = ref('basic')

const tabs = [
  { key: 'basic', label: '基本设置' },
  { key: 'security', label: '安全设置' },
  { key: 'notification', label: '通知设置' },
]

const basicForm = reactive({
  retentionDays: 30,
  siteName: 'CShop 电商平台',
  email: 'admin@cshop.com',
})

const securityForm = reactive({
  loginLock: true,
  sessionTimeout: '30',
  ipWhitelist: false,
  minPasswordLength: 8,
})

const notifyForm = reactive({
  newOrder: true,
  stockAlert: true,
  userRegister: false,
  emailNotify: true,
  smsNotify: false,
  notifyEmail: 'admin@cshop.com',
})
</script>
