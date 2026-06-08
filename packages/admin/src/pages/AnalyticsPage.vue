<template>
  <div class="p-6 flex flex-col gap-5 h-full">
    <div class="flex items-center justify-between">
      <h1 class="text-[22px] font-bold text-text-primary">数据分析</h1>
      <button class="rounded border border-border px-4 py-2.5 text-[13px] font-medium text-text-primary flex items-center gap-2 hover:bg-gray-50 transition-colors">
        <Download :size="16" />
        导出报表
      </button>
    </div>

    <div class="flex items-center gap-1">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="rounded px-3.5 py-1.5 text-[13px] transition-colors"
        :class="activeTab === tab.key
          ? 'bg-primary text-white font-medium'
          : 'text-text-muted hover:bg-gray-100'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div
        v-for="metric in currentMetrics"
        :key="metric.label"
        class="bg-card border border-border rounded-md p-5 flex flex-col gap-2"
      >
        <span class="text-text-muted text-[13px] font-medium">{{ metric.label }}</span>
        <span class="text-text-primary text-[28px] font-bold">{{ metric.value }}</span>
        <span
          class="text-xs font-medium"
          :class="metric.positive ? 'text-primary-light' : 'text-danger'"
        >
          {{ metric.change }}
        </span>
      </div>
    </div>

    <div class="flex gap-4 h-[340px]">
      <div class="flex-1 bg-card border border-border rounded-md px-6 py-5 flex flex-col gap-4 min-w-0">
        <span class="text-[15px] font-semibold text-text-primary">热销商品 TOP5</span>
        <div class="flex-1 flex flex-col gap-3">
          <div v-for="item in currentTopProducts" :key="item.name" class="flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <span class="text-[13px] text-text-primary">{{ item.name }}</span>
              <span class="text-xs text-text-muted font-mono">{{ item.sales }} 件</span>
            </div>
            <div class="h-1.5 bg-[#C8DBBC] rounded-full overflow-hidden">
              <div
                class="h-full bg-primary rounded-full"
                :style="{ width: item.percent + '%' }"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="w-[400px] bg-card border border-border rounded-md px-6 py-5 flex flex-col gap-4 shrink-0">
        <span class="text-[15px] font-semibold text-text-primary">转化漏斗</span>
        <div class="flex-1 flex flex-col gap-2.5 justify-center">
          <div
            v-for="(step, index) in currentFunnel"
            :key="step.label"
            class="flex items-center justify-between rounded px-4 py-2.5"
            :style="{ backgroundColor: step.bg, color: step.fg }"
          >
            <span class="text-[13px] font-medium">{{ step.label }}</span>
            <span class="text-[13px] font-mono font-semibold">{{ step.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Download } from 'lucide-vue-next'

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

const allFunnel: Record<string, Array<{ label: string; value: string; bg: string; fg: string }>> = {
  today: [
    { label: '商品浏览', value: '6,542', bg: '#1B3A28', fg: '#FFFFFF' },
    { label: '加入购物车', value: '486', bg: '#2D5E3A', fg: '#FFFFFF' },
    { label: '提交订单', value: '178', bg: '#4A8C5E', fg: '#1B3A28' },
    { label: '完成支付', value: '128', bg: '#6BAF7A', fg: '#1B3A28' },
  ],
  '7d': [
    { label: '商品浏览', value: '45,678', bg: '#1B3A28', fg: '#FFFFFF' },
    { label: '加入购物车', value: '3,456', bg: '#2D5E3A', fg: '#FFFFFF' },
    { label: '提交订单', value: '1,234', bg: '#4A8C5E', fg: '#1B3A28' },
    { label: '完成支付', value: '890', bg: '#6BAF7A', fg: '#1B3A28' },
  ],
  '30d': [
    { label: '商品浏览', value: '198,432', bg: '#1B3A28', fg: '#FFFFFF' },
    { label: '加入购物车', value: '14,567', bg: '#2D5E3A', fg: '#FFFFFF' },
    { label: '提交订单', value: '5,234', bg: '#4A8C5E', fg: '#1B3A28' },
    { label: '完成支付', value: '3,890', bg: '#6BAF7A', fg: '#1B3A28' },
  ],
}

const currentMetrics = computed(() => allMetrics[activeTab.value])
const currentTopProducts = computed(() => allTopProducts[activeTab.value])
const currentFunnel = computed(() => allFunnel[activeTab.value])
</script>
