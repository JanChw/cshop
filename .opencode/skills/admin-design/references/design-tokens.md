# CShop Admin 设计令牌

基于 `packages/admin/src/assets/main.css` 的 `@theme` 定义。

---

## 颜色调色板

### 主色系（绿色森林）

| 令牌 | 十六进制 | 用途 |
|------|---------|------|
| `--color-primary` | `#2D5E3A` | 主按钮、活动导航、强调色 |
| `--color-primary-light` | `#4A8C5E` | 次要强调、正增量 |
| `--color-primary-muted` | `#4A6B52` | 次要文字、描述 |
| `--color-primary-dark` | `#1B3A28` | 标题、正文（与 text-primary 同） |

### 表面色

| 令牌 | 十六进制 | 用途 |
|------|---------|------|
| `--color-background` | `#F8F9FA` | 页面底色 |
| `--color-card` | `#FFFFFF` | 卡片/面板/表格容器 |
| `--color-border` | `#DEE2E6` | 边框/分割线/输入框边框 |

### 文字色

| 令牌 | 十六进制 | 用途 |
|------|---------|------|
| `--color-text-primary` | `#1B3A28` | 标题、正文、标签 |
| `--color-text-muted` | `#4A6B52` | 辅助文字、占位符、图标色 |
| `--color-text-light` | `#6B6B6B` | 次要辅助文字 |

### 语义色

| 令牌 | 十六进制 | 用途 |
|------|---------|------|
| `--color-success` | `#28A745` | 成功/已上架/已完成 |
| `--color-warning` | `#F59E0B` | 警告/待处理/待发货 |
| `--color-danger` | `#EF4444` | 危险/已取消/删除 |
| `--color-info` | `#4A9FD8` | 信息/已发货/通知 |

### 侧边栏

| 令牌 | 十六进制 | 用途 |
|------|---------|------|
| `--color-sidebar-bg` | `#1A1A1A` | 侧边栏底色 |
| `--color-sidebar-text` | `#B5C4B8` | 侧边栏文字（灰绿色） |

### 图表

| 令牌 | 十六进制 | 用途 |
|------|---------|------|
| `--color-chart-bar` | `#DBEAFE` | 图表柱状默认色 |
| `--color-primary` | `#2D5E3A` | 图表强调柱色 |

---

## 排版

### 字族

| 令牌 | 值 | 用途 |
|------|-----|------|
| `--font-primary` | `'Inter', system-ui, sans-serif` | UI 文本 |
| `--font-mono` | `'Geist Mono', ui-monospace, monospace` | 代码、订单号、ID |

> 注意：Inter 和 Geist Mono 需要从 Google Fonts 加载。如未加载，`system-ui` / `ui-monospace` 作为后备生效。

### 字号映射

| Tailwind 类 | 像素 | 视重 | 行高 | 场景 |
|-------------|------|------|------|------|
| `text-xs` | 12px | 500 (font-medium) | 1.5 | 表格列头、状态标签、辅助文字 |
| `text-sm` | 14px | 400/500 | 1.5 | 正文、按钮、输入框、表格内容 |
| `text-base` | 16px | 600 (font-semibold) | 1.5 | 卡片标题、弹窗标题 |
| `text-lg` | 18px | 600 (font-semibold) | 1.4 | 区域子标题 |
| `text-xl` | 20px | 700 (font-bold) | 1.4 | 页面标题 |
| `text-2xl` | 24px | 700 (font-bold) | 1.3 | 仪表盘指标值 |
| `text-3xl` | 30px | 700 (font-bold) | 1.3 | 大数字展示（备用） |

---

## 间距

| 值 | Tailwind | 场景 |
|----|----------|------|
| 4px | `gap-1` / `p-1` | 极小间距 |
| 6px | `gap-1.5` | 表单标签与输入框之间 |
| 8px | `gap-2` / `p-2` | 图标与文字之间 |
| 12px | `gap-3` / `p-3` | 按钮组、筛选器间隙 |
| 16px | `gap-4` / `p-4` | 页面内容间距 |
| 20px | `gap-5` / `p-5` | 卡片内边距 |
| 24px | `gap-6` / `p-6` | 页面内边距、区块间隙 |
| 28px | `gap-7` / `p-7` | 大间距 |

---

## 圆角

| 值 | Tailwind | 场景 |
|----|----------|------|
| 4px | `rounded` (默认) | 按钮、输入框、卡片、模态框 |
| 6px | `rounded-md` | 可选卡片组件 |
| 9999px | `rounded-full` | 状态标签（Badge）、头像 |
| 0 | `rounded-none` | 表格、列表（直边） |

---

## 阴影

| 层级 | Tailwind | 场景 |
|------|----------|------|
| 1 | `shadow-sm` | 卡片轻微浮起 |
| 2 | `shadow` | 弹窗面板 |
| 3 | `shadow-lg` | 模态框 |

---

## 元素高度

| 组件 | 高度 | Tailwind |
|------|------|----------|
| 输入框 | 36px | `h-9` |
| 按钮 | 36px | `h-9`（小）/ `h-10`（含图标） |
| 表格表头行 | 44px | `h-11` |
| 表格数据行 | 52px | `h-[52px]` |
| 顶部栏 | 64px | `h-16` |
| 侧边栏 | 100% | `h-full` |

---

## 模态框宽度

| 场景 | 宽度 |
|------|------|
| 简单表单 | 480px |
| 复杂表单/大内容 | 600px |
| 确认弹窗 | 400px |
