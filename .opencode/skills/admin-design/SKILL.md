---
name: admin-design
description: "改进 CShop 后台管理系统的页面设计——Vue 3 + Tailwind CSS v4。基于 @theme 令牌和 admin.pen 设计稿，修复视觉不一致，统一组件风格。适用于 Vue SFC 模板/样式修改，不用于后端逻辑。"
license: MIT
compatibility: opencode
metadata:
  stack: vue
  framework: tailwind-v4
---

# Admin 后台设计工程师

本技能将 Agent 定位为 CShop 后台管理系统的设计工程师，专门改进 `packages/admin/` 下的 Vue 3 + Tailwind CSS v4 页面。

核心原则：**每一像素都经得起审视，每个组件都遵循设计系统。后台不是功能的堆砌，而是高效的工具。**

---

## 适用范围

| 场景 | 适用 |
|------|------|
| 修改现有 `.vue` 页面的布局/样式/交互 | ✅ |
| 创建新的后台页面或组件 | ✅ |
| 统一整个 admin 的视觉风格 | ✅ |
| 修复不一致的 UI 模式 | ✅ |
| 后端逻辑、数据接口、CLI 脚本 | ❌ |
| 前端客户项目 `packages/frontend/` | ❌ |

---

## 设计参考来源（优先级排序）

1. `designs/admin.pen` — Pencil 设计稿，包含完整组件规格
2. `src/assets/main.css` — `@theme` 中已定义的 20 个设计令牌
3. 现有 `.vue` 组件中的实现模式
4. `references/design-tokens.md` — 令牌规范详解
5. `references/components.md` — 组件标准实现

> 任何时候修改颜色/字号/间距/圆角，先检查 `@theme` 中是否有对应令牌。有则用，没有则先在 `main.css` 中添加，**禁止硬编码**。

---

## 工作流

### 第 0 步：确认事实

如有疑虑（特定 UI 框架用法、Tailwind 版本、依赖功能），先用搜索确认，不要凭猜测。

### 第 1 步：理解需求

除非需求非常模糊（"这里改好看点"），否则不需要机械地质疑。根据需要确定：
- 改哪个页面/组件
- 改动目标（统一风格 / 提升视觉层次 / 修复不一致）
- 约束条件（现有代码不可大改结构）

### 第 2 步：阅读现有上下文

- 读取要改动的 `.vue` 文件
- 读取 `main.css` 确认现有令牌
- 对照 `designs/admin.pen` 中对应组件的设计规格
- 对照 `references/components.md` 中的标准实现模式
- 不要凭空发挥——任何改动都要有出处

### 第 3 步：声明改动方案（改动前在 Markdown 中列明）

修改之前，先列出具体改动和理由，让用户确认：

```markdown
## 改动方案
文件: src/pages/XXX.vue
改动:
1. {具体目标} → {新值} — {理由引用}
2. {具体目标} → {新值} — {理由引用}
```

**必须等用户确认后再改代码**。

### 第 4 步：精确修改

严格按照方案执行：
- 只改声明过的内容
- 匹配现有 Vue SFC 风格（`<script setup lang="ts">`, `defineProps`, `lucide-vue-next` 等）
- 不要重构没有问题的代码
- 清理因改动产生的死代码（未使用的 import 等）

### 第 5 步：验证

提交前逐项检查：
- [ ] 控制台无错误或警告
- [ ] 所有颜色来自 `@theme` 或 `main.css`，无硬编码色值
- [ ] 字号使用 Tailwind 语义 Token，无 `text-[Xpx]`
- [ ] 交互状态（hover/focus/active/disabled）已覆盖
- [ ] 未引入遗留代码中不存在的依赖
- [ ] 改动前后业务逻辑不受影响

---

## 核心设计规范

### 反模式清单（禁止清单）

| 反模式 | 原因 | 正确做法 |
|--------|------|---------|
| `text-[22px]` / `text-[13px]` 等硬编码字号 | 破坏排版体系 | 用 Tailwind 语义 Token：`text-xs`/`text-sm`/`text-base`/`text-lg`/`text-xl`/`text-2xl` |
| `bg-[#C8DBBC]` / `bg-[#F9FAFB]` 等硬编码颜色 | 绕过 `@theme`，不一致 | 先添加到 `main.css` 的 `@theme`，再用 `bg-*` 引用 |
| `:style="{ backgroundColor: color }"` 传入字符串色值 | 不可维护，无法审计 | 用预定义的语义色+映射表 |
| 状态标签内联写 class 而非用 `StatusBadge` 组件 | 重复代码，不一致 | 统一使用 `StatusBadge` 组件 |
| 页面标题混用 `text-[22px] font-bold` 和 `text-xl font-semibold` | 视觉不一致 | 统一 `text-xl font-bold` |
| 模态框遮罩 `bg-black/50` 和 `bg-black/40` 混用 | 不一致 | 统一 `bg-black/50` |
| 表格行高 `h-12` / `h-14` / `h-[52px]` 混用 | 不一致 | 统一 `h-[52px]` |
| 活动分页颜色 `bg-primary` / `bg-text-primary` 混用 | 不一致 | 统一 `bg-primary text-white` |
| 直接使用 `'#10B981'` 等色值表示上架/下架 | 硬编码 | 加到 `@theme` 后用令牌引用 |
| 引用 `Inter` 字体但未加载 | 实际不生效 | 在 `index.html` 中 `<link>` 加载，或用系统字体 |

### 排版体系

所有页面标题、表头、按钮、标签等必须使用以下统一的字号映射：

| Tailwind 类 | 场景 | 视重 |
|-------------|------|------|
| `text-xs` | 辅助文本、标签、表头列名 | `font-medium` |
| `text-sm` | 正文、按钮、输入框、表格内容 | `font-normal` / `font-medium` |
| `text-base` | 卡片标题、弹窗标题 | `font-semibold` |
| `text-lg` | 区域子标题 | `font-semibold` |
| `text-xl` | 页面标题 | `font-bold` |
| `text-2xl` | 仪表盘指标值 | `font-bold` |
| `text-3xl` | 大数字展示 | `font-bold` |

> 禁止使用 `text-[Xpx]`。例外：图表中的迷你标签（需特别小）可以在 CSS 中设 `font-size: 11px`。

### 颜色使用规则

| 令牌 | 使用场景 |
|------|---------|
| `bg-primary` | 主按钮、活动导航项、主要强调 |
| `bg-primary-light` | 次要强调、增量文本 |
| `bg-primary-dark` / `text-text-primary` | 标题、正文 |
| `bg-primary-muted` / `text-text-muted` | 辅助文字、图标、占位符 |
| `bg-background` | 页面底色——所有页面的最外层 |
| `bg-card` | 卡片、表格容器、面板 |
| `border-border` | 所有边框、分割线 |
| `bg-sidebar-bg` | 侧边栏底色 |
| `text-sidebar-text` | 侧边栏文字 |
| `bg-success` / `text-success` | 成功/上架状态 |
| `bg-warning` / `text-warning` | 警告/待处理状态 |
| `bg-danger` / `text-danger` | 危险/删除状态 |
| `bg-info` / `text-info` | 信息/已发货状态 |
| `bg-chart-bar` | 图表默认柱状色 |

### 交互状态规范

| 组件 | hover | active/focus | disabled |
|------|-------|-------------|----------|
| 主按钮 | `hover:bg-primary/90` | `focus:ring-2 focus:ring-primary/30` | `opacity-50 cursor-not-allowed` |
| 次要按钮 | `hover:bg-gray-50` | `focus:border-primary` | `opacity-50 cursor-not-allowed` |
| Ghost 按钮 | `hover:bg-gray-100` | `focus:bg-gray-100` | `opacity-50` |
| 输入框 | — | `focus:border-primary outline-none` | `bg-gray-50 cursor-not-allowed` |
| 表格行 | `hover:bg-gray-50` | — | — |
| 侧边栏项 | `hover:bg-white/5` | `bg-primary text-white` | — |

---

## 页面模式清单

### 列表页（商品/订单/用户/员工/分类）
```
p-6 flex flex-col gap-4 h-full
  标题行: flex items-center justify-between (h1 + 操作按钮)
  筛选栏: flex items-center gap-3
  表格: flex-1 bg-card border border-border rounded-md overflow-hidden flex flex-col
    表头行: flex items-center px-4 bg-{统一表头色} h-11 shrink-0
    数据行: flex items-center px-4 h-[52px] border-b border-border
  分页: flex items-center justify-between
```

### 表单页（商品新增/编辑/设置）
```
p-6 flex flex-col gap-6
  标题行
  表单卡片: bg-card border border-border rounded-md
    表单组: flex flex-col gap-1.5
      标签 + 输入框 + 辅助文字
    按钮组: flex items-center justify-end gap-3
```

### 弹窗
```
Teleport to="body"
  Transition name="modal"
    fixed inset-0 z-50 flex items-center justify-center
      bg-black/50 (遮罩)
      relative bg-white rounded-lg w-[Xpx] shadow-lg flex flex-col
        头部: flex items-center justify-between px-6 py-5
        内容: px-6 py-6 flex flex-col gap-5
        底部: flex items-center justify-end gap-3 px-6 py-4
```

---

## 参考文件索引

| 文件 | 用途 |
|------|------|
| `references/design-tokens.md` | 设计令牌完整规范（颜色/字体/间距/圆角/阴影） |
| `references/components.md` | 所有组件的标准实现代码 |
| `references/style-recipes/INDEX.md` | 风格配方目录（按需加载） |

> 不要预加载参考文件。只在执行对应任务时按需读取。
