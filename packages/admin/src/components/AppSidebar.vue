<template>
  <aside class="w-[260px] bg-sidebar-bg flex flex-col gap-2 h-full py-5 px-3 shrink-0">
    <div class="flex items-center gap-3 px-3 py-2">
      <div class="w-8 h-8 rounded bg-primary flex items-center justify-center">
        <span class="text-white font-bold text-sm">C</span>
      </div>
      <span class="text-white font-bold text-lg">CShop</span>
    </div>

    <div class="h-4" />

    <nav class="flex flex-col gap-1">
      <RouterLink
        v-for="(item, index) in navItems"
        :key="item.path"
        :to="item.path"
        draggable="true"
        class="flex items-center gap-3 rounded px-3 py-2.5 text-sm transition-colors cursor-grab select-none"
        :class="[
          isActive(item.path)
            ? 'bg-primary text-white font-medium'
            : 'text-sidebar-text hover:bg-white/5',
          dragIndex === index ? 'opacity-50' : '',
          dragOverIndex === index ? 'border-t-2 border-primary' : '',
        ]"
        @dragstart="onDragStart(index)"
        @dragover.prevent="onDragOver(index)"
        @dragenter.prevent="onDragEnter(index)"
        @dragleave="onDragLeave"
        @drop="onDrop(index)"
        @dragend="onDragEnd"
      >
        <GripVertical :size="14" class="shrink-0 opacity-40 cursor-grab" />
        <component :is="item.icon" :size="20" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Folder,
  Users,
  UserCheck,
  Activity,
  Settings,
  Database,
  Shield,
  GripVertical,
} from 'lucide-vue-next'

const route = useRoute()

interface NavItem {
  path: string
  label: string
  icon: typeof LayoutDashboard
}

const defaultNavItems: NavItem[] = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/products', label: '商品管理', icon: Package },
  { path: '/orders', label: '订单管理', icon: ShoppingCart },
  { path: '/categories', label: '分类管理', icon: Folder },
  { path: '/users', label: '用户管理', icon: Users },
  { path: '/staff', label: '员工管理', icon: UserCheck },
  { path: '/roles', label: '角色权限', icon: Shield },
  { path: '/analytics', label: '数据分析', icon: Activity },
  { path: '/backups', label: '数据备份', icon: Database },
  { path: '/settings', label: '系统设置', icon: Settings },
]

const navItems = ref<NavItem[]>([])
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const STORAGE_KEY = 'cshop-nav-order'

function loadOrder() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const order: string[] = JSON.parse(saved)
      const sorted = order
        .map((path) => defaultNavItems.find((item) => item.path === path))
        .filter((item): item is NavItem => !!item)
      const newItems = defaultNavItems.filter((item) => !order.includes(item.path))
      navItems.value = [...sorted, ...newItems]
      return
    }
  } catch {
    // ignore
  }
  navItems.value = [...defaultNavItems]
}

function saveOrder() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(navItems.value.map((item) => item.path)))
}

onMounted(() => {
  loadOrder()
})

function onDragStart(index: number) {
  dragIndex.value = index
}

function onDragOver(index: number) {
  dragOverIndex.value = index
}

function onDragEnter(index: number) {
  dragOverIndex.value = index
}

function onDragLeave() {
  dragOverIndex.value = null
}

function onDrop(index: number) {
  if (dragIndex.value === null || dragIndex.value === index) return
  const item = navItems.value.splice(dragIndex.value, 1)[0]
  navItems.value.splice(index, 0, item)
  saveOrder()
}

function onDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
}

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
