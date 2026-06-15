<template>
  <div class="p-6 pb-12 flex flex-col gap-5 min-h-screen">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-text-primary">数据分析</h1>
      <button class="rounded border border-border px-4 py-2.5 text-sm font-medium text-text-primary flex items-center gap-2 hover:bg-gray-50 transition-colors">
        <Download :size="16" />
        导出报表
      </button>
    </div>

    <div class="flex items-center gap-1">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="rounded px-3.5 py-1.5 text-sm transition-colors"
        :class="activeTab === tab.key
          ? 'bg-primary text-white font-medium'
          : 'text-text-muted hover:bg-gray-100'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div data-analytics-grid class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="metric in currentMetrics"
        :key="metric.label"
        class="bg-card border border-border rounded-md p-5 flex flex-col gap-2"
      >
        <span class="text-text-muted text-sm font-medium">{{ metric.label }}</span>
        <span class="text-text-primary text-2xl font-bold">{{ metric.value }}</span>
        <span
          class="text-xs font-medium"
          :class="metric.positive ? 'text-primary-light' : 'text-danger'"
        >
          {{ metric.change }}
        </span>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-4 h-auto lg:h-[340px]">
      <div class="flex-1 bg-card border border-border rounded-md px-6 py-5 flex flex-col gap-4 min-w-0">
        <span class="text-base font-semibold text-text-primary">热销商品 TOP5</span>
        <div class="flex-1 flex flex-col gap-3">
          <div v-for="item in currentTopProducts" :key="item.name" class="flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <span class="text-sm text-text-primary">{{ item.name }}</span>
              <span class="text-xs text-text-muted font-mono">{{ item.sales }} 件</span>
            </div>
            <div class="h-1.5 bg-chart-track rounded-full overflow-hidden">
              <div
                data-progress-bar
                class="h-full bg-primary rounded-full"
                :style="{ width: item.percent + '%' }"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="w-full lg:w-[400px] bg-card border border-border rounded-md px-6 py-5 flex flex-col gap-4 shrink-0">
        <span class="text-base font-semibold text-text-primary">转化漏斗</span>
        <div class="flex-1 flex flex-col gap-2.5 justify-center">
          <div
            v-for="(step, index) in currentFunnel"
            :key="step.label"
            class="flex items-center justify-between rounded px-4 py-2.5"
            :class="step.cls"
          >
            <span class="text-sm font-medium">{{ step.label }}</span>
            <span class="text-sm font-mono font-semibold">{{ step.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { Download } from 'lucide-vue-next'
import gsap from 'gsap'
import { api } from '@/utils/api'

interface AnalyticsData {
  dau: number
  pv: number
  topProducts: Array<{ productId: number; productName: string; views: number }>
  funnel: { productView: number; cartAdd: number; orderCreate: number }
  trend: Array<{ date: string; pv: number; dau: number }>
  deviceDistribution: Array<{ deviceType: string; count: number }>
}

const activeTab = ref('today')

const tabs = [
  { key: 'today', label: '今日' },
  { key: '7d', label: '最近7天' },
  { key: '30d', label: '最近30天' },
]

const data = ref<Record<string, AnalyticsData | null>>({
  today: null,
  '7d': null,
  '30d': null,
})

async function fetchData(period: string) {
  try {
    const res = await api.get<AnalyticsData>('/admin/analytics/summary', { period })
    if (res.success) {
      data.value[period] = res.data
    }
  } catch (e) {
    console.error('Failed to fetch analytics:', e)
  }
}

const currentMetrics = computed(() => {
  const d = data.value[activeTab.value]
  if (!d) return []

  const conversion = d.funnel.productView > 0 ? ((d.funnel.orderCreate / d.funnel.productView) * 100) : 0

  return [
    { label: '日活用户 (DAU)', value: d.dau.toLocaleString(), change: '', positive: true },
    { label: '页面浏览量 (PV)', value: d.pv.toLocaleString(), change: '', positive: true },
    { label: '转化率', value: conversion.toFixed(1) + '%', change: '', positive: true },
    { label: '平均停留', value: '-', change: '', positive: true },
  ]
})

const currentTopProducts = computed(() => {
  const d = data.value[activeTab.value]
  if (!d || !d.topProducts.length) return []

  const maxViews = Math.max(...d.topProducts.map(p => p.views))

  return d.topProducts.slice(0, 5).map(p => ({
    name: p.productName,
    sales: p.views,
    percent: maxViews > 0 ? Math.round((p.views / maxViews) * 100) : 0,
  }))
})

const funnelCls = [
  'bg-primary-dark text-white',
  'bg-primary text-white',
  'bg-primary-light text-primary-dark',
]

const currentFunnel = computed(() => {
  const d = data.value[activeTab.value]
  if (!d) return []

  const funnelLabels = ['商品浏览', '加入购物车', '提交订单']
  const funnelValues = [d.funnel.productView, d.funnel.cartAdd, d.funnel.orderCreate]

  return funnelLabels.map((label, i) => ({
    label,
    value: funnelValues[i].toLocaleString(),
    cls: funnelCls[i],
  }))
})

function animateAnalytics() {
  nextTick(() => {
    const cards = document.querySelectorAll('[data-analytics-grid] > div')
    gsap.fromTo(cards, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' })

    const progBars = document.querySelectorAll('[data-progress-bar]')
    progBars.forEach(el => { (el as HTMLElement).style.width = '0%' })
    gsap.to(progBars, {
      width: (i: number) => `${currentTopProducts.value[i]?.percent ?? 0}%`,
      duration: 0.5, stagger: 0.08, ease: 'power2.out', delay: 0.15
    })

    const funnelSteps = document.querySelectorAll('.flex-1.flex-col.gap-2\\.5.justify-center > div')
    gsap.fromTo(funnelSteps, { opacity: 0, x: 20 }, {
      opacity: 1, x: 0, duration: 0.3, stagger: 0.08, ease: 'power2.out', delay: 0.2
    })
  })
}

async function loadAndAnimate() {
  await fetchData(activeTab.value)
  animateAnalytics()
}

onMounted(loadAndAnimate)

watch(activeTab, () => {
  if (!data.value[activeTab.value]) {
    loadAndAnimate()
  } else {
    animateAnalytics()
  }
})
</script>
