<template>
  <header class="sticky top-0 z-10 h-16 glass border-b border-border flex items-center justify-between px-6 shrink-0">
    <div class="flex items-center gap-2 text-sm">
      <RouterLink to="/" class="text-text-muted">首页</RouterLink>
      <ChevronRight :size="14" class="text-text-muted" />
      <span class="text-text-primary font-medium">{{ currentPageTitle }}</span>
    </div>

    <div class="flex items-center gap-4">
      <ThemeSwitcher />
      <button class="text-text-muted hover:text-primary transition-colors">
        <Bell :size="20" />
      </button>
      <div class="flex items-center gap-2 cursor-pointer relative group" @click="toggleDropdown">
        <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span class="text-white text-xs font-bold">{{ userInitial }}</span>
        </div>
        <span class="text-sm text-text-primary hidden md:block">{{ userName }}</span>
      </div>
      <div
        v-if="dropdownOpen"
        class="absolute top-14 right-6 w-48 bg-card border border-border rounded-md shadow-lg py-1 z-50"
        @click.stop
      >
        <div class="px-4 py-2 border-b border-border">
          <p class="text-sm font-medium text-text-primary">{{ userName }}</p>
          <p class="text-xs text-text-muted">{{ userEmail }}</p>
        </div>
        <button
          class="w-full px-4 py-2 text-sm text-left text-text-primary hover:bg-gray-50 transition-colors flex items-center gap-2"
          @click="handleLogout"
        >
          退出登录
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronRight, Bell } from 'lucide-vue-next'
import ThemeSwitcher from '@/components/ui/ThemeSwitcher.vue'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { user, logout } = useAuth()

const dropdownOpen = ref(false)

const titleMap: Record<string, string> = {
  '/': '仪表盘',
  '/products': '商品管理',
  '/orders': '订单管理',
  '/categories': '分类管理',
  '/users': '用户管理',
  '/staff': '员工管理',
  '/analytics': '数据分析',
  '/settings': '系统设置',
  '/backups': '数据备份',
  '/roles': '角色权限',
}

const currentPageTitle = computed(() => {
  return titleMap[route.path] || '页面'
})

const userName = computed(() => user.value?.name || '管理员')
const userEmail = computed(() => user.value?.email || '')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

function handleLogout() {
  logout()
  router.push('/login')
}

function handleClickOutside() {
  dropdownOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
