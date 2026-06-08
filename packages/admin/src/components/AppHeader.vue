<template>
  <header class="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
    <div class="flex items-center gap-2 text-sm">
      <RouterLink to="/" class="text-text-muted">首页</RouterLink>
      <ChevronRight :size="14" class="text-text-muted" />
      <span class="text-text-primary font-medium">{{ currentPageTitle }}</span>
    </div>

    <div class="flex items-center gap-4">
      <button class="text-text-muted hover:text-primary transition-colors">
        <Bell :size="20" />
      </button>
      <div
        class="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
      >
        <span class="text-white text-xs font-bold">A</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight, Bell } from 'lucide-vue-next'

const route = useRoute()

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
  if (route.path === '/') return '仪表盘'
  return titleMap[route.path] || '页面'
})
</script>
