<template>
  <div class="p-6 flex flex-col gap-6 h-full">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-[22px] font-bold text-text-primary">仪表盘</h1>
        <p class="text-[13px] text-text-muted">欢迎回来，管理员</p>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <MetricCard
        v-for="metric in metrics"
        :key="metric.label"
        v-bind="metric"
      />
    </div>

    <div class="flex gap-4 flex-1 min-h-0">
      <div class="flex-1 bg-card border border-border rounded-md p-5 flex flex-col gap-4 min-w-0">
        <div class="flex items-center justify-between">
          <span class="text-[15px] font-semibold text-text-primary">销售趋势</span>
          <span class="text-xs text-text-muted">最近7天</span>
        </div>
        <div class="flex-1 min-h-0">
          <BarChart :bars="chartBars" />
        </div>
      </div>

      <div class="w-[480px] bg-card border border-border rounded-md p-5 flex flex-col gap-4 shrink-0">
        <span class="text-[15px] font-semibold text-text-primary">最近订单</span>

        <div class="flex items-center pb-2 border-b border-border">
          <span class="flex-1 text-[12px] font-semibold text-text-muted">订单号</span>
          <span class="flex-1 text-[12px] font-semibold text-text-muted">客户</span>
          <span class="flex-1 text-[12px] font-semibold text-text-muted">金额</span>
          <span class="w-[70px] text-[12px] font-semibold text-text-muted">状态</span>
        </div>

        <div
          v-for="order in recentOrders"
          :key="order.id"
          class="flex items-center py-2.5 border-b border-border"
        >
          <span class="flex-1 text-[13px] text-text-primary font-mono">{{ order.id }}</span>
          <span class="flex-1 text-[13px] text-text-primary">{{ order.customer }}</span>
          <span class="flex-1 text-[13px] text-text-primary font-medium">{{ order.amount }}</span>
          <StatusBadge v-bind="order.badge" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Package, Timer, TrendingUp, Users } from 'lucide-vue-next'
import MetricCard from '@/components/ui/MetricCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import BarChart from '@/components/ui/BarChart.vue'

const metrics = [
  { label: '商品总数', value: '128', change: '+5 本月', icon: Package },
  { label: '待处理订单', value: '23', change: '+3 今日', icon: Timer },
  { label: '本月营收', value: '¥48,250', change: '+12.5%', icon: TrendingUp },
  { label: '注册用户', value: '2,543', change: '+126 本月', icon: Users },
]

const chartBars = [
  { label: '周一', height: 60, color: '#DBEAFE' },
  { label: '周二', height: 45, color: '#DBEAFE' },
  { label: '周三', height: 80, color: '#DBEAFE' },
  { label: '周四', height: 55, color: '#DBEAFE' },
  { label: '周五', height: 70, color: '#DBEAFE' },
  { label: '周六', height: 90, color: '#2D5E3A' },
  { label: '周日', height: 65, color: '#DBEAFE' },
]

const recentOrders = [
  { id: '#1024', customer: '张三', amount: '¥299', badge: { label: '待处理', color: '#F59E0B' } },
  { id: '#1023', customer: '李四', amount: '¥599', badge: { label: '已发货', color: '#2D5E3A' } },
  { id: '#1022', customer: '王五', amount: '¥199', badge: { label: '已完成', color: '#4A8C5E' } },
  { id: '#1021', customer: '赵六', amount: '¥899', badge: { label: '待处理', color: '#F59E0B' } },
  { id: '#1020', customer: '钱七', amount: '¥399', badge: { label: '已取消', color: '#EF4444' } },
]
</script>
