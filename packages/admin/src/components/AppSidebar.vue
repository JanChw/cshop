<template>
  <aside
    class="bg-sidebar-bg flex flex-col h-full py-5 shrink-0 transition-all duration-300 overflow-hidden"
    :class="collapsed ? 'w-16 px-2' : 'w-44 px-3'"
  >
    <div class="flex items-center px-2 py-2 cursor-pointer select-none" :class="collapsed ? 'justify-center gap-0.5' : 'gap-3'" @click="toggleCollapsed">
      <div class="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0">
        <span class="text-white font-bold text-sm">C</span>
      </div>
      <span v-show="!collapsed" class="text-white font-bold text-lg whitespace-nowrap flex-1">CShop</span>
      <ChevronLeft
        :size="collapsed ? 14 : 18"
        class="shrink-0 text-sidebar-text transition-transform duration-300"
        :class="collapsed ? 'rotate-180' : ''"
      />
    </div>

    <div v-show="!collapsed" class="h-4" />

    <nav class="flex flex-col gap-1 flex-1">
      <template v-for="(item, index) in navItems" :key="item.id ?? item.path">
        <div v-if="item.children && item.children.length > 0">
          <button
            :draggable="!collapsed && !!item.id"
            :title="collapsed ? item.label : ''"
            class="flex items-center gap-3 rounded transition-colors select-none w-full"
            :class="[
              collapsed
                ? 'justify-center p-2'
                : 'px-3 py-2.5 cursor-grab',
              groupActive(item) ? 'bg-primary text-white font-medium' : 'text-sidebar-text hover:bg-white/5',
              dragIndex === index ? 'opacity-50' : '',
              dragOverIndex === index ? 'border-t-2 border-primary' : '',
            ]"
            @dragstart="!collapsed && onDragStart(index)"
            @dragover.prevent="!collapsed && onDragOver(index)"
            @dragenter.prevent="!collapsed && onDragEnter(index)"
            @dragleave="!collapsed && onDragLeave"
            @drop="!collapsed && onDrop(index)"
            @dragend="!collapsed && onDragEnd"
            @click="handleGroupClick(item)"
          >
            <GripVertical v-show="!collapsed" :size="14" class="shrink-0 opacity-40" />
            <component :is="resolveIcon(item.icon)" :size="20" class="shrink-0" />
            <span v-show="!collapsed" class="text-sm whitespace-nowrap flex-1 text-left">{{ item.label }}</span>
            <ChevronDown v-show="!collapsed" :size="14" class="shrink-0 transition-transform duration-200" :class="expandedKeys.has(item.id) ? '' : '-rotate-90'" />
          </button>
          <div v-show="!collapsed && expandedKeys.has(item.id)" class="flex flex-col gap-0.5 ml-3 mt-0.5 border-l border-white/10 pl-2">
            <RouterLink
              v-for="(child, childIdx) in item.children"
              :key="child.id ?? child.path"
              :to="child.path"
              :draggable="!collapsed"
              class="flex items-center gap-2 rounded transition-colors select-none"
              :class="[
                collapsed ? 'justify-center p-2' : 'px-3 py-2 cursor-grab',
                isActive(child.path) ? 'bg-primary/80 text-white font-medium' : 'text-sidebar-text hover:bg-white/5',
                dragChildRef?.parentIdx === index && dragChildRef?.from === childIdx ? 'opacity-50' : '',
                dropChildParentIdx === index && dropChildIdx === childIdx ? 'border-t-2 border-primary' : '',
              ]"
              @dragstart="!collapsed && onChildDragStart(index, childIdx)"
              @dragover.prevent="!collapsed && onChildDragOver(index, childIdx)"
              @dragenter.prevent="!collapsed && onChildDragOver(index, childIdx)"
              @dragleave="!collapsed && onChildDragLeave"
              @drop="!collapsed && onChildDrop(index, childIdx)"
              @dragend="!collapsed && onChildDragEnd"
            >
              <GripVertical v-show="!collapsed" :size="12" class="shrink-0 opacity-40" />
              <component :is="resolveIcon(child.icon)" :size="16" class="shrink-0" />
              <span v-show="!collapsed" class="text-sm whitespace-nowrap">{{ child.label }}</span>
            </RouterLink>
          </div>
        </div>
        <RouterLink
          v-else
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
      </template>
    </nav>

  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import gsap from 'gsap'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Folder,
  Layers,
  Users,
  UserCheck,
  Activity,
  Settings,
  Database,
  Shield,
  Palette,
  GripVertical,
  ChevronLeft,
  ChevronDown,
  type LucideIcon
} from 'lucide-vue-next'
import { api } from '@/utils/api'

const route = useRoute()
const router = useRouter()

interface MenuItem {
  id: number
  name: string
  path: string
  icon: string | null
  sort: number
  isVisible: boolean
  children: MenuItem[]
}

interface NavItem {
  id: number | null
  path: string
  label: string
  icon: string | null
  children: NavItem[]
}

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Folder,
  Layers,
  Users,
  UserCheck,
  Activity,
  Settings,
  Database,
  Shield,
  Palette
}

function resolveIcon(name: string | null) {
  if (!name) return Folder
  return ICON_MAP[name] ?? Folder
}

const navItems = ref<NavItem[]>([])
const expandedKeys = ref(new Set<number>())
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
const dragChildRef = ref<{ parentIdx: number; from: number } | null>(null)
const dropChildParentIdx = ref<number | null>(null)
const dropChildIdx = ref<number | null>(null)
const collapsed = ref(false)
const COLLAPSED_KEY = 'cshop-sidebar-collapsed'

function buildNavTree(items: MenuItem[]): NavItem[] {
  const visible = items.filter(i => i.isVisible).sort((a, b) => a.sort - b.sort)
  return visible.map(n => ({
    id: n.id,
    path: n.path,
    label: n.name,
    icon: n.icon,
    children: n.children ? buildNavTree(n.children) : []
  }))
}

function findParentIdForPath(items: NavItem[], path: string): number | null {
  for (const item of items) {
    if (item.children && item.children.length > 0) {
      if (item.children.some(c => c.path === path)) return item.id
      const found = findParentIdForPath(item.children, path)
      if (found) return found
    }
  }
  return null
}

function groupActive(item: NavItem): boolean {
  if (!item.children) return false
  return item.children.some(c => isActive(c.path))
}

async function fetchMenus() {
  const res = await api.get<{ items: MenuItem[] }>('/admin/menus', { type: 'admin' })
  if (res.success && res.data) {
    navItems.value = buildNavTree(res.data.items || [])
    const activeParentId = findParentIdForPath(navItems.value, route.path)
    if (activeParentId) {
      expandedKeys.value = new Set([...expandedKeys.value, activeParentId])
    }
  }
}

function toggleGroup(id: number) {
  const next = new Set(expandedKeys.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  expandedKeys.value = next
}

function handleGroupClick(item: NavItem) {
  if (collapsed.value) {
    collapsed.value = false
    if (item.children && item.children.length > 0) {
      router.push(item.children[0].path)
    }
  } else {
    toggleGroup(item.id)
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

function onChildDragStart(parentIdx: number, childIdx: number) {
  dragChildRef.value = { parentIdx, from: childIdx }
}

function onChildDragOver(parentIdx: number, childIdx: number) {
  dropChildParentIdx.value = parentIdx
  dropChildIdx.value = childIdx
}

function onChildDragLeave() {
  dropChildParentIdx.value = null
  dropChildIdx.value = null
}

async function onChildDrop(parentIdx: number, toIdx: number) {
  if (!dragChildRef.value || dragChildRef.value.parentIdx !== parentIdx) {
    onChildDragEnd()
    return
  }
  const { parentIdx: pIdx, from } = dragChildRef.value
  const parent = navItems.value[pIdx]
  if (!parent || from === toIdx) { onChildDragEnd(); return }
  const item = parent.children.splice(from, 1)[0]
  parent.children.splice(toIdx, 0, item)
  onChildDragEnd()
  await persistOrder()
}

function onChildDragEnd() {
  dragChildRef.value = null
  dropChildParentIdx.value = null
  dropChildIdx.value = null
}

async function persistOrder() {
  const payload: { id: number; parentId: number | null; sort: number }[] = []
  navItems.value.forEach((item, idx) => {
    if (item.id !== null) payload.push({ id: item.id, parentId: null, sort: idx })
    if (item.children) {
      item.children.forEach((child, childIdx) => {
        if (child.id !== null) payload.push({ id: child.id, parentId: item.id as number, sort: childIdx })
      })
    }
  })
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
