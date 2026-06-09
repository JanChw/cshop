<template>
  <aside
    class="bg-sidebar-bg flex flex-col h-full py-5 shrink-0 transition-all duration-300 overflow-hidden"
    :class="collapsed ? 'w-16 px-2' : 'w-44 px-3'"
  >
    <div class="flex items-center px-2 py-2" :class="collapsed ? 'justify-center' : 'gap-3'">
      <div class="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0">
        <span class="text-white font-bold text-sm">C</span>
      </div>
      <span v-show="!collapsed" class="text-white font-bold text-lg whitespace-nowrap">CShop</span>
    </div>

    <div v-show="!collapsed" class="h-4" />

    <nav class="flex flex-col gap-1 flex-1">
      <RouterLink
        v-for="(item, index) in navItems"
        :key="item.path"
        :to="item.path"
        :draggable="!collapsed"
        :title="collapsed ? item.label : ''"
        class="flex items-center gap-3 rounded transition-colors select-none"
        :class="[
          collapsed
            ? 'justify-center p-2'
            : 'px-3 py-2.5 cursor-grab',
          isActive(item.path)
            ? 'bg-primary text-white font-medium'
            : 'text-sidebar-text hover:bg-white/5',
          dragIndex === index ? 'opacity-50' : '',
          dragOverIndex === index ? 'border-t-2 border-primary' : '',
        ]"
        @dragstart="!collapsed && onDragStart(index)"
        @dragover.prevent="!collapsed && onDragOver(index)"
        @dragenter.prevent="!collapsed && onDragEnter(index)"
        @dragleave="!collapsed && onDragLeave"
        @drop="!collapsed && onDrop(index)"
        @dragend="!collapsed && onDragEnd"
      >
        <GripVertical v-show="!collapsed" :size="14" class="shrink-0 opacity-40" />
        <component :is="item.icon" :size="20" class="shrink-0" />
        <span v-show="!collapsed" class="text-sm whitespace-nowrap">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <button
      aria-label="折叠侧边栏"
      class="flex items-center justify-center rounded p-2 text-sidebar-text hover:bg-white/5 transition-colors mt-2"
      @click="toggleCollapsed"
    >
      <ChevronLeft :size="18" class="transition-transform duration-300" :class="collapsed ? 'rotate-180' : ''" />
    </button>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'
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
  ChevronLeft,
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
const collapsed = ref(false)

const STORAGE_KEY = 'cshop-nav-order'
const COLLAPSED_KEY = 'cshop-sidebar-collapsed'

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

function loadCollapsed() {
  try {
    collapsed.value = localStorage.getItem(COLLAPSED_KEY) === 'true'
  } catch {
    collapsed.value = false
  }
}

function toggleCollapsed() {
  collapsed.value = !collapsed.value
  localStorage.setItem(COLLAPSED_KEY, String(collapsed.value))
}

onMounted(() => {
  loadOrder()
  loadCollapsed()

  const mq = window.matchMedia('(max-width: 1023px)')
  function handleScreen(e: MediaQueryListEvent | MediaQueryList) {
    if (e.matches) collapsed.value = true
  }
  handleScreen(mq)
  mq.addEventListener('change', handleScreen)
})

watch(collapsed, (isCollapsed) => {
  const labels = document.querySelectorAll('aside nav span.text-sm')
  if (isCollapsed) {
    gsap.to(labels, { opacity: 0, duration: 0.15, stagger: 0.02, ease: 'power2.in' })
  } else {
    gsap.fromTo(labels, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.25, stagger: 0.03, ease: 'power2.out' })
  }
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
