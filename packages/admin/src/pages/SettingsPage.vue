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

      <div class="flex-1 bg-card border border-border rounded-md px-8 py-6 min-w-0 overflow-auto">
        <Transition name="tab-panel" mode="out-in">
          <div v-if="activeTab === 'basic'" key="basic" class="flex flex-col gap-6">
            <div>
              <h2 class="text-base font-semibold text-text-primary">基本设置</h2>
              <p class="text-sm text-text-muted mt-1">配置系统的基本参数</p>
            </div>

            <div class="flex flex-col gap-5">
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-text-primary">回收站保留天数</label>
                <p class="text-xs text-text-muted">超过此天数的回收站商品将被永久删除（0 表示不自动清理）</p>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="basicForm.retentionDays"
                    type="number"
                    min="0"
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
              <button @click="saveBasicSettings" class="rounded h-10 px-4 text-sm font-medium text-white bg-primary flex items-center gap-2 hover:bg-primary/90 transition-colors">
                <Check :size="16" />
                保存设置
              </button>
              <button @click="resetBasicSettings" class="rounded h-10 px-4 text-sm font-medium text-text-primary border border-border flex items-center gap-2 hover:bg-gray-50 transition-colors">
                <RotateCcw :size="16" />
                重置
              </button>
            </div>
          </div>

          <div v-else-if="activeTab === 'security'" key="security" class="flex flex-col gap-6">
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
                  <span class="text-xs text-text-muted">连续登录失败 {{ securityForm.maxAttempts }} 次后锁定账户 {{ securityForm.lockMinutes }} 分钟</span>
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

              <div class="flex items-center py-3 border-b border-border gap-6">
                <div class="flex flex-col gap-0.5 shrink-0 min-w-[240px]">
                  <span class="text-sm font-medium text-text-primary">最大失败次数</span>
                  <span class="text-xs text-text-muted">连续登录失败达到此次数后锁定账户</span>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="securityForm.maxAttempts"
                    type="number"
                    min="1"
                    max="20"
                    :disabled="!securityForm.loginLock || !localLocks.maxAttempts"
                    class="w-[140px] h-9 rounded border border-border px-3 text-sm text-left text-text-primary font-mono outline-none focus:border-primary transition-colors disabled:bg-gray-50 disabled:text-text-muted"
                  />
                  <span class="text-sm text-text-muted">次</span>
                </div>
                <div
                  class="ml-auto w-10 h-6 rounded-full cursor-pointer transition-colors relative"
                  :class="localLocks.maxAttempts ? 'bg-primary' : 'bg-gray-300'"
                  :title="localLocks.maxAttempts ? '点击锁定' : '点击解锁以编辑'"
                  @click="localLocks.maxAttempts = !localLocks.maxAttempts"
                >
                  <div
                    class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                    :class="localLocks.maxAttempts ? 'translate-x-4.5' : 'translate-x-0.5'"
                  />
                </div>
              </div>

              <div class="flex items-center py-3 border-b border-border gap-6">
                <div class="flex flex-col gap-0.5 shrink-0 min-w-[240px]">
                  <span class="text-sm font-medium text-text-primary">锁定时长</span>
                  <span class="text-xs text-text-muted">账号锁定后需等待的时间</span>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="securityForm.lockMinutes"
                    type="number"
                    min="1"
                    max="1440"
                    :disabled="!securityForm.loginLock || !localLocks.lockMinutes"
                    class="w-[140px] h-9 rounded border border-border px-3 text-sm text-left text-text-primary font-mono outline-none focus:border-primary transition-colors disabled:bg-gray-50 disabled:text-text-muted"
                  />
                  <span class="text-sm text-text-muted">分钟</span>
                </div>
                <div
                  class="ml-auto w-10 h-6 rounded-full cursor-pointer transition-colors relative"
                  :class="localLocks.lockMinutes ? 'bg-primary' : 'bg-gray-300'"
                  :title="localLocks.lockMinutes ? '点击锁定' : '点击解锁以编辑'"
                  @click="localLocks.lockMinutes = !localLocks.lockMinutes"
                >
                  <div
                    class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                    :class="localLocks.lockMinutes ? 'translate-x-4.5' : 'translate-x-0.5'"
                  />
                </div>
              </div>

              <div class="flex items-center py-3 border-b border-border gap-6">
                <div class="flex flex-col gap-0.5 shrink-0 min-w-[240px]">
                  <span class="text-sm font-medium text-text-primary">会话超时</span>
                  <span class="text-xs text-text-muted">超过指定时间未操作将自动退出登录</span>
                </div>
                <div class="flex items-center gap-2">
                  <select
                    v-model="securityForm.sessionTimeout"
                    :disabled="!localLocks.sessionTimeout"
                    class="w-[140px] h-9 rounded border border-border px-3 text-sm text-text-primary bg-white outline-none appearance-none cursor-pointer disabled:bg-gray-50 disabled:text-text-muted"
                  >
                    <option value="15">15 分钟</option>
                    <option value="30">30 分钟</option>
                    <option value="60">1 小时</option>
                    <option value="120">2 小时</option>
                  </select>
                </div>
                <div
                  class="ml-auto w-10 h-6 rounded-full cursor-pointer transition-colors relative"
                  :class="localLocks.sessionTimeout ? 'bg-primary' : 'bg-gray-300'"
                  :title="localLocks.sessionTimeout ? '点击锁定' : '点击解锁以编辑'"
                  @click="localLocks.sessionTimeout = !localLocks.sessionTimeout"
                >
                  <div
                    class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                    :class="localLocks.sessionTimeout ? 'translate-x-4.5' : 'translate-x-0.5'"
                  />
                </div>
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

              <div class="flex items-center py-3 border-b border-border gap-6">
                <div class="flex flex-col gap-0.5 shrink-0 min-w-[240px]">
                  <span class="text-sm font-medium text-text-primary">密码最小长度</span>
                  <span class="text-xs text-text-muted">新密码必须满足此长度要求</span>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="securityForm.minPasswordLength"
                    type="number"
                    min="6"
                    max="32"
                    :disabled="!localLocks.minPasswordLength"
                    class="w-[140px] h-9 rounded border border-border px-3 text-sm text-left text-text-primary font-mono outline-none focus:border-primary transition-colors disabled:bg-gray-50 disabled:text-text-muted"
                  />
                  <span class="text-sm text-text-muted">位</span>
                </div>
                <div
                  class="ml-auto w-10 h-6 rounded-full cursor-pointer transition-colors relative"
                  :class="localLocks.minPasswordLength ? 'bg-primary' : 'bg-gray-300'"
                  :title="localLocks.minPasswordLength ? '点击锁定' : '点击解锁以编辑'"
                  @click="localLocks.minPasswordLength = !localLocks.minPasswordLength"
                >
                  <div
                    class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                    :class="localLocks.minPasswordLength ? 'translate-x-4.5' : 'translate-x-0.5'"
                  />
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button @click="saveSecuritySettings" class="rounded h-10 px-4 text-sm font-medium text-white bg-primary flex items-center gap-2 hover:bg-primary/90 transition-colors">
                <Check :size="16" />
                保存设置
              </button>
            </div>
          </div>

          <div v-else-if="activeTab === 'notification'" key="notification" class="flex flex-col gap-6">
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
                  <span class="text-xs text-text-muted">通过邮件发送系统通知（与短信通知互斥，默认邮件）</span>
                </div>
                <div
                  class="w-10 h-6 rounded-full cursor-pointer transition-colors relative"
                  :class="notifyForm.emailNotify ? 'bg-primary' : 'bg-gray-300'"
                  @click="toggleEmailNotify"
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
                  <span class="text-xs text-text-muted">通过短信发送重要通知（与邮件通知互斥，目前为模拟）</span>
                </div>
                <div
                  class="w-10 h-6 rounded-full cursor-pointer transition-colors relative"
                  :class="notifyForm.smsNotify ? 'bg-primary' : 'bg-gray-300'"
                  @click="toggleSmsNotify"
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
              <button @click="saveNotifySettings" class="rounded h-10 px-4 text-sm font-medium text-white bg-primary flex items-center gap-2 hover:bg-primary/90 transition-colors">
                <Check :size="16" />
                保存设置
              </button>
              <button
                @click="sendTestEmail"
                :disabled="testEmailSending"
                class="rounded h-10 px-4 text-sm font-medium text-primary border border-primary flex items-center gap-2 hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail :size="16" />
                {{ testEmailSending ? '发送中...' : '发送测试邮件' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Check, RotateCcw, Mail } from 'lucide-vue-next'
import { api } from '@/utils/api'
import { useToast } from '@/composables/useToast'

const { success: toastSuccess, error: toastError } = useToast()

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
  maxAttempts: 3,
  lockMinutes: 30,
  sessionTimeout: '30',
  ipWhitelist: false,
  minPasswordLength: 8,
})

const localLocks = reactive({
  maxAttempts: false,
  lockMinutes: false,
  sessionTimeout: false,
  minPasswordLength: false,
})

const notifyForm = reactive({
  newOrder: true,
  stockAlert: true,
  userRegister: false,
  emailNotify: true,
  smsNotify: false,
  notifyEmail: 'admin@cshop.com',
})

async function fetchSettings() {
  const res = await api.get<Record<string, string>>('/admin/settings')
  if (res.success && res.data) {
    const d = res.data
    if (d.trash_retention_days !== undefined) {
      basicForm.retentionDays = Number(d.trash_retention_days)
    }
    if (d.site_name !== undefined) basicForm.siteName = d.site_name
    if (d.contact_email !== undefined) basicForm.email = d.contact_email

    if (d.login_lock !== undefined) securityForm.loginLock = d.login_lock === 'true'
    if (d.login_max_attempts !== undefined) securityForm.maxAttempts = Number(d.login_max_attempts)
    if (d.login_lock_minutes !== undefined) securityForm.lockMinutes = Number(d.login_lock_minutes)
    if (d.session_timeout !== undefined) securityForm.sessionTimeout = d.session_timeout
    if (d.ip_whitelist !== undefined) securityForm.ipWhitelist = d.ip_whitelist === 'true'
    if (d.min_password_length !== undefined) securityForm.minPasswordLength = Number(d.min_password_length)

    if (d.notify_new_order !== undefined) notifyForm.newOrder = d.notify_new_order === 'true'
    if (d.notify_stock_alert !== undefined) notifyForm.stockAlert = d.notify_stock_alert === 'true'
    if (d.notify_user_register !== undefined) notifyForm.userRegister = d.notify_user_register === 'true'
    if (d.notify_email !== undefined) notifyForm.emailNotify = d.notify_email === 'true'
    if (d.notify_sms !== undefined) notifyForm.smsNotify = d.notify_sms === 'true'
    if (d.notify_receive_email !== undefined) notifyForm.notifyEmail = d.notify_receive_email
  }
}

async function saveBasicSettings() {
  const res = await api.put('/admin/settings', {
    trash_retention_days: String(basicForm.retentionDays),
    site_name: basicForm.siteName,
    contact_email: basicForm.email,
  })
  if (res.success) {
    toastSuccess('保存成功')
  } else {
    toastError(res.error || '保存失败')
  }
}

async function resetBasicSettings() {
  await fetchSettings()
  toastSuccess('已重置')
}

async function saveSecuritySettings() {
  const res = await api.put('/admin/settings', {
    login_lock: String(securityForm.loginLock),
    login_max_attempts: String(securityForm.maxAttempts),
    login_lock_minutes: String(securityForm.lockMinutes),
    session_timeout: securityForm.sessionTimeout,
    ip_whitelist: String(securityForm.ipWhitelist),
    min_password_length: String(securityForm.minPasswordLength),
  })
  if (res.success) {
    toastSuccess('保存成功')
  } else {
    toastError(res.error || '保存失败')
  }
}

async function saveNotifySettings() {
  const res = await api.put('/admin/settings', {
    notify_new_order: String(notifyForm.newOrder),
    notify_stock_alert: String(notifyForm.stockAlert),
    notify_user_register: String(notifyForm.userRegister),
    notify_email: String(notifyForm.emailNotify),
    notify_sms: String(notifyForm.smsNotify),
    notify_receive_email: notifyForm.notifyEmail,
  })
  if (res.success) {
    toastSuccess('保存成功')
  } else {
    toastError(res.error || '保存失败')
  }
}

const testEmailSending = ref(false)

async function sendTestEmail() {
  testEmailSending.value = true
  const res = await api.post<{ sent: boolean; to: string }>('/admin/settings/test-email', {})
  testEmailSending.value = false
  if (res.success) {
    toastSuccess(`已发送至 ${res.data?.to}`)
  } else {
    toastError(res.error || '发送失败')
  }
}

onMounted(fetchSettings)

function toggleEmailNotify() {
  if (!notifyForm.emailNotify) {
    notifyForm.emailNotify = true
    notifyForm.smsNotify = false
  } else {
    notifyForm.emailNotify = false
  }
}

function toggleSmsNotify() {
  if (!notifyForm.smsNotify) {
    notifyForm.smsNotify = true
    notifyForm.emailNotify = false
  } else {
    notifyForm.smsNotify = false
  }
}
</script>

<style scoped>
.tab-panel-enter-active,
.tab-panel-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.tab-panel-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.tab-panel-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
