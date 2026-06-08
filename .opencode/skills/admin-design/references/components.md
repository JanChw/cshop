# CShop Admin 组件标准实现

基于 `designs/admin.pen` 设计规格和现有 Vue 组件模式整理。

---

## 按钮

### Primary 主按钮
```html
<button class="h-9 rounded bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
  Button
</button>
```
- 设计稿：bg `#2D5E3A`, r=4, text white 14px/500, padding 10×16
- 带图标：`flex items-center gap-2`

### Outline 次要按钮
```html
<button class="h-9 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors">
  Button
</button>
```
- 设计稿：透明底, r=4, stroke `$border`, text `#1B3A28` 14px/500

### Destructive 危险按钮
```html
<button class="h-9 rounded bg-danger px-4 text-sm font-medium text-white hover:bg-danger/90 transition-colors">
  Delete
</button>
```

### Ghost 幽灵按钮
```html
<button class="rounded p-1 text-text-muted hover:bg-gray-100 transition-colors">
  <Icon :size="18" />
</button>
```
- 设计稿：透明底, r=4, text `#1B3A28` 14px/500
- 常用于弹窗关闭按钮、表格操作图标按钮

### Link 文字按钮
```html
<button class="text-sm text-primary hover:underline">
  编辑
</button>
```

---

## 输入框

### 标准输入框
```html
<input
  type="text"
  placeholder="Placeholder"
  class="h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
/>
```
- 设计稿：h=36, r=4, border `$border`, padding 8×12, text 14px

### 搜索框
```html
<div class="flex items-center gap-2 h-10 rounded border border-border px-3 bg-card">
  <Search :size="16" class="text-text-muted shrink-0" />
  <input
    type="text"
    placeholder="搜索..."
    class="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
  />
</div>
```

### 选择框
```html
<div class="relative">
  <select
    class="h-10 rounded border border-border px-3 pr-8 text-sm text-text-primary bg-card outline-none appearance-none cursor-pointer"
  >
    <option value="">全部</option>
  </select>
  <ChevronDown :size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
</div>
```

### 表单字段组
```html
<div class="flex flex-col gap-1.5">
  <label class="text-sm font-medium text-text-primary">Label</label>
  <input type="text" placeholder="..." class="h-9 rounded border border-border px-3 text-sm ..." />
  <p class="text-xs text-text-muted">辅助说明</p>
</div>
```

---

## 状态标签

使用 `StatusBadge` 组件（`@/components/ui/StatusBadge.vue`），**不要内联**：

```vue
<StatusBadge label="待处理" color="#F59E0B" />
<StatusBadge label="已发货" color="#2D5E3A" />
<StatusBadge label="已完成" color="#4A8C5E" />
<StatusBadge label="已取消" color="#EF4444" />
<StatusBadge label="已上架" color="#28A745" />
<StatusBadge label="已下架" color="#9CA3AF" />
```

设计稿规格：r=9999(pill), padding 4×10, text white 12px/500

---

## 卡片

```html
<div class="bg-card border border-border rounded-md p-5 flex flex-col gap-4">
  <div class="flex items-center justify-between">
    <span class="text-base font-semibold text-text-primary">Card Title</span>
  </div>
  <div>Content</div>
</div>
```
- 设计稿：bg `#FFFFFF`, r=6, stroke `$border`, title 16px/600, desc 13px

---

## MetricCard 指标卡

```vue
<template>
  <div class="bg-card border border-border rounded-md p-5 flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <span class="text-text-muted text-sm font-medium">{{ label }}</span>
      <component :is="icon" :size="18" class="text-text-muted" />
    </div>
    <span class="text-text-primary text-2xl font-bold">{{ value }}</span>
    <span class="text-primary-light text-xs font-medium">{{ change }}</span>
  </div>
</template>
```
- 设计稿：value 28px, change 带 light green

---

## 数据表格

### 表头行
```html
<div class="flex items-center px-4 bg-[#F9FAFB] h-11 shrink-0 gap-3">
  <span class="w-[80px] text-xs font-semibold text-text-primary">列名</span>
  <span class="flex-1 text-xs font-semibold text-text-primary">列名</span>
</div>
```
- 设计稿（`Table/HeaderRow`）：像素级别 flex 布局

### 数据行
```html
<div class="flex items-center px-4 h-[52px] border-b border-border gap-3 hover:bg-gray-50 transition-colors">
  <span class="w-[80px] text-sm text-text-primary">值</span>
  <span class="flex-1 text-sm text-text-primary">值</span>
</div>
```
- 设计稿（`Table/DataRow`）：h-12→52px, border-b 分割线

**列宽策略**：
- 固定小字段（ID、状态、操作）：用 `w-[50px]` / `w-[70px]` / `w-[100px]`
- 弹性大字段（名称、描述）：用 `flex-1`
- 避免硬编码宽字段，优先 `flex-1`

---

## 分页

```html
<div class="flex items-center justify-between">
  <span class="text-sm text-text-muted">共 {{ total }} 条</span>
  <div class="flex items-center gap-1">
    <button
      class="w-8 h-8 rounded border border-border text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-colors"
      :disabled="page === 1"
      @click="page--"
    >
      <ChevronLeft :size="14" />
    </button>
    <button
      v-for="p in pages" :key="p"
      class="w-8 h-8 rounded text-sm flex items-center justify-center transition-colors"
      :class="p === page
        ? 'bg-primary text-white'
        : 'border border-border hover:bg-gray-50'"
      @click="page = p"
    >
      {{ p }}
    </button>
    <button
      class="w-8 h-8 rounded border border-border text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-colors"
      :disabled="page === pages"
      @click="page++"
    >
      <ChevronRight :size="14" />
    </button>
  </div>
</div>
```
- 活动页用 `bg-primary text-white`（统一，非 `bg-text-primary`）

---

## 模态框

```vue
<Teleport to="body">
  <Transition name="modal">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="$emit('close')">
      <div class="absolute inset-0 bg-black/50" />
      <div class="relative bg-white rounded-lg w-[480px] shadow-lg flex flex-col">
        <div class="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 class="text-base font-semibold text-text-primary">Title</h2>
          <button class="rounded p-1 text-text-muted hover:text-text-primary transition-colors" @click="$emit('close')">
            <X :size="18" />
          </button>
        </div>
        <div class="px-6 py-6 flex flex-col gap-5">
          <!-- 表单内容 -->
        </div>
        <div class="flex items-center justify-end gap-3 px-6 py-4">
          <button class="rounded px-4 py-2 text-sm font-medium text-text-primary border border-border hover:bg-gray-50 transition-colors" @click="$emit('close')">取消</button>
          <button class="rounded px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors flex items-center gap-2" @click="handleSave">确认</button>
        </div>
      </div>
    </div>
  </Transition>
</Teleport>
```

**遮罩统一**：`bg-black/50`（非 `/40`）
**圆角统一**：`rounded-lg`（约 8px，与设计稿 `rounded` 4px 略有区别，弹窗用 `rounded-lg` 更合适）

---

## 侧边栏导航

```html
<RouterLink
  :to="item.path"
  class="flex items-center gap-3 rounded px-3 py-2.5 text-sm transition-colors"
  :class="isActive
    ? 'bg-primary text-white font-medium'
    : 'text-sidebar-text hover:bg-white/5'"
>
  <component :is="item.icon" :size="20" />
  <span>{{ item.label }}</span>
</RouterLink>
```

---

## 顶部栏

```html
<header class="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
  <div class="flex items-center gap-2 text-sm">
    <!-- Breadcrumb -->
  </div>
  <div class="flex items-center gap-4">
    <button class="text-text-muted hover:text-primary transition-colors">
      <Bell :size="20" />
    </button>
    <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
      <span class="text-white text-xs font-bold">A</span>
    </div>
  </div>
</header>
```

---

## 搜索筛选栏

```html
<div class="flex items-center gap-3">
  <!-- 搜索框 -->
  <div class="flex items-center gap-2 h-10 rounded border border-border px-3 bg-card w-[320px]">
    <Search :size="16" class="text-text-muted shrink-0" />
    <input type="text" placeholder="搜索..." class="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none" />
  </div>
  <!-- 下拉筛选 -->
  <div class="relative">
    <select class="h-10 rounded border border-border px-3 pr-8 text-sm text-text-primary bg-card outline-none appearance-none cursor-pointer">
      <option>全部</option>
    </select>
    <ChevronDown :size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
  </div>
</div>
```

---

## 弹窗确认（确认删除等）

```html
<div class="fixed inset-0 z-50 flex items-center justify-center">
  <div class="absolute inset-0 bg-black/50" />
  <div class="relative bg-white rounded-lg w-[400px] shadow-lg flex flex-col p-7 gap-5">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
        <AlertTriangle :size="20" class="text-danger" />
      </div>
      <h2 class="text-base font-semibold text-text-primary">确认删除</h2>
    </div>
    <p class="text-sm text-text-muted">此操作不可撤销，确认删除？</p>
    <div class="flex items-center justify-end gap-3">
      <button class="...">取消</button>
      <button class="... bg-danger ...">确认删除</button>
    </div>
  </div>
</div>
```
