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

const activeTab = ref('7d')

const tabs = [
  { key: 'today', label: '今日' },
  { key: '7d', label: '最近7天' },
  { key: '30d', label: '最近30天' },
]

const allMetrics: Record<string, Array<{ label: string; value: string; change: string; positive: boolean }>> = {
  today: [
    { label: '日活用户 (DAU)', value: '328', change: '+5.1% 较昨日', positive: true },
    { label: '页面浏览量 (PV)', value: '6,542', change: '+3.8% 较昨日', positive: true },
    { label: '转化率', value: '2.8%', change: '+0.3% 较昨日', positive: true },
    { label: '平均停留', value: '3:45', change: '-0.1% 较昨日', positive: false },
  ],
  '7d': [
    { label: '日活用户 (DAU)', value: '1,234', change: '+8.2% 较上周', positive: true },
    { label: '页面浏览量 (PV)', value: '45,678', change: '+15.3% 较上周', positive: true },
    { label: '转化率', value: '3.2%', change: '+0.5% 较上周', positive: true },
    { label: '平均停留', value: '4:32', change: '-0.2% 较上周', positive: false },
  ],
  '30d': [
    { label: '日活用户 (DAU)', value: '5,678', change: '+12.6% 较上月', positive: true },
    { label: '页面浏览量 (PV)', value: '198,432', change: '+22.1% 较上月', positive: true },
    { label: '转化率', value: '3.5%', change: '+0.8% 较上月', positive: true },
    { label: '平均停留', value: '5:12', change: '+0.4% 较上月', positive: true },
  ],
}

const allTopProducts: Record<string, Array<{ name: string; sales: number; percent: number }>> = {
  today: [
    { name: '经典圆领T恤', sales: 42, percent: 100 },
    { name: '潮流连帽卫衣', sales: 35, percent: 83 },
    { name: '修身牛仔裤', sales: 28, percent: 67 },
    { name: '纯棉Polo衫', sales: 21, percent: 50 },
    { name: '加绒外套', sales: 15, percent: 36 },
  ],
  '7d': [
    { name: '经典圆领T恤', sales: 234, percent: 100 },
    { name: '潮流连帽卫衣', sales: 189, percent: 81 },
    { name: '修身牛仔裤', sales: 156, percent: 67 },
    { name: '纯棉Polo衫', sales: 123, percent: 53 },
    { name: '加绒外套', sales: 98, percent: 42 },
  ],
  '30d': [
    { name: '经典圆领T恤', sales: 892, percent: 100 },
    { name: '潮流连帽卫衣', sales: 756, percent: 85 },
    { name: '修身牛仔裤', sales: 634, percent: 71 },
    { name: '纯棉Polo衫', sales: 512, percent: 57 },
    { name: '加绒外套', sales: 423, percent: 47 },
  ],
}

const allFunnel: Record<string, Array<{ label: string; value: string; cls: string }>> = {
  today: [
    { label: '商品浏览', value: '6,542', cls: 'bg-primary-dark text-white' },
    { label: '加入购物车', value: '486', cls: 'bg-primary text-white' },
    { label: '提交订单', value: '178', cls: 'bg-primary-light text-primary-dark' },
    { label: '完成支付', value: '128', cls: 'bg-primary-light/70 text-primary-dark' },
  ],
  '7d': [
    { label: '商品浏览', value: '45,678', cls: 'bg-primary-dark text-white' },
    { label: '加入购物车', value: '3,456', cls: 'bg-primary text-white' },
    { label: '提交订单', value: '1,234', cls: 'bg-primary-light text-primary-dark' },
    { label: '完成支付', value: '890', cls: 'bg-primary-light/70 text-primary-dark' },
  ],
  '30d': [
    { label: '商品浏览', value: '198,432', cls: 'bg-primary-dark text-white' },
    { label: '加入购物车', value: '14,567', cls: 'bg-primary text-white' },
    { label: '提交订单', value: '5,234', cls: 'bg-primary-light text-primary-dark' },
    { label: '完成支付', value: '3,890', cls: 'bg-primary-light/70 text-primary-dark' },
  ],
}

const currentMetrics = computed(() => allMetrics[activeTab.value])
const currentTopProducts = computed(() => allTopProducts[activeTab.value])
const currentFunnel = computed(() => allFunnel[activeTab.value])

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

onMounted(animateAnalytics)
watch(activeTab, animateAnalytics)
</script>
