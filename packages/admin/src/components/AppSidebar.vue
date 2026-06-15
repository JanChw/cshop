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
        :key="item.id ?? item.path"
        :to="item.path"
        :draggable="!collapsed && !!item.id"
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
        <component :is="resolveIcon(item.icon)" :size="20" class="shrink-0" />
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
  type LucideIcon
} from 'lucide-vue-next'
import { api } from '@/utils/api'

const route = useRoute()

interface MenuItem {
  id: number
  name: string
  path: string
  icon: string | null
  sort: number
  isVisible: boolean
}

interface NavItem {
  id: number | null
  path: string
  label: string
  icon: string | null
}

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Folder,
  Users,
  UserCheck,
  Activity,
  Settings,
  Database,
  Shield
}

function resolveIcon(name: string | null) {
  if (!name) return Folder
  return ICON_MAP[name] ?? Folder
}

const navItems = ref<NavItem[]>([])
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
const collapsed = ref(false)
const COLLAPSED_KEY = 'cshop-sidebar-collapsed'

function flattenTree(items: MenuItem[]): NavItem[] {
  const out: NavItem[] = []
  const visit = (nodes: MenuItem[]) => {
    for (const n of nodes) {
      out.push({ id: n.id, path: n.path, label: n.name, icon: n.icon })
    }
  }
  visit(items.filter(i => i.isVisible).sort((a, b) => a.sort - b.sort))
  return out
}

async function fetchMenus() {
  const res = await api.get<{ items: MenuItem[] }>('/admin/menus', { type: 'admin' })
  if (res.success && res.data) {
    navItems.value = flattenTree(res.data.items || [])
  }
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
  fetchMenus()
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

async function onDrop(index: number) {
  if (dragIndex.value === null || dragIndex.value === index) {
    onDragEnd()
    return
  }
  const from = dragIndex.value
  const item = navItems.value.splice(from, 1)[0]
  navItems.value.splice(index, 0, item)
  onDragEnd()
  await persistOrder()
}

function onDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
}

async function persistOrder() {
  const payload = navItems.value
    .filter((item) => item.id !== null)
    .map((item, index) => ({ id: item.id as number, parentId: null, sort: index }))
  if (payload.length === 0) return
  const res = await api.put('/admin/menus/reorder', payload)
  if (!res.success) {
    console.error('保存菜单顺序失败', res.error)
    await fetchMenus()
  }
}

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
