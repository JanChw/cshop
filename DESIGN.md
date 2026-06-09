---
name: CShop Admin
description: Lightweight e-commerce management panel
colors:
  primary: "#2D5E3A"
  primary-light: "#4A8C5E"
  primary-muted: "#4A6B52"
  primary-dark: "#1B3A28"
  background: "#F8F9FA"
  card: "#FFFFFF"
  border: "#DEE2E6"
  text-primary: "#1B3A28"
  text-muted: "#4A6B52"
  text-light: "#6B6B6B"
  sidebar-bg: "#1A1A1A"
  sidebar-text: "#B5C4B8"
  chart-bar: "#DBEAFE"
  table-header: "#F9FAFB"
  success: "#28A745"
  warning: "#F59E0B"
  danger: "#EF4444"
  info: "#4A9FD8"
  status-active: "#10B981"
  status-inactive: "#9CA3AF"
typography:
  display:
    fontSize: "text-xl"
    fontWeight: 700
    lineHeight: 1.25
  heading:
    fontSize: "text-base"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontSize: "text-sm"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontSize: "text-sm"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
    fontSize: "text-sm"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    border: "1px solid var(--color-border)"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
    fontSize: "text-sm"
  button-secondary-hover:
    backgroundColor: "rgba(0,0,0,0.03)"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text-primary}"
    border: "1px solid var(--color-border)"
    rounded: "{rounded.sm}"
    fontSize: "text-sm"
    height: "36px"
    padding: "0 12px"
  input-focus:
    borderColor: "{colors.primary}"
  table-header:
    backgroundColor: "{colors.table-header}"
    fontSize: "text-xs"
    fontWeight: 600
    height: "44px"
  table-row:
    fontSize: "text-sm"
    height: "52px"
    borderBottom: "1px solid var(--color-border)"
  card:
    backgroundColor: "{colors.card}"
    border: "1px solid var(--color-border)"
    rounded: "{rounded.sm}"
  sidebar-item:
    backgroundColor: "transparent"
    textColor: "{colors.sidebar-text}"
  sidebar-item-active:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
  badge:
    rounded: "9999px"
    fontSize: "text-xs"
    fontWeight: 500
    padding: "2px 8px"
  toast-success:
    backgroundColor: "{colors.primary-dark}"
    textColor: "#FFFFFF"
  toast-error:
    backgroundColor: "{colors.danger}"
    textColor: "#FFFFFF"
  toast-info:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
  modal-backdrop:
    backgroundColor: "rgba(0,0,0,0.5)"
  modal-container:
    backgroundColor: "rgba(255,255,255,0.9)"
    backdropFilter: "blur(16px)"
    rounded: "{rounded.lg}"
    border: "1px solid var(--color-border)"
    padding: "28px"
---

## Overview

CShop 管理后台采用 Vue 3 + Tailwind CSS 4 + Vue Router 4 构建。设计目标是一个清晰、高效、温暖的电商运营工具。

- 10 个页面：仪表盘、商品、订单、分类、用户、员工、角色权限、数据分析、备份、设置
- 3 个主要主题：森林绿（默认）、海洋蓝、星空紫
- 使用 lucide-vue-next 作为图标库

## Colors

### Base palette (forest theme, default)

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#2D5E3A` | Primary actions, active nav, brand elements |
| `primary-light` | `#4A8C5E` | Success badges, secondary highlights |
| `primary-dark` | `#1B3A28` | Page titles, body text, dark surfaces |
| `primary-muted` | `#4A6B52` | Muted text, secondary labels |
| `background` | `#F8F9FA` | Page background |
| `card` | `#FFFFFF` | Card backgrounds, table containers |
| `border` | `#DEE2E6` | All borders and dividers |
| `sidebar-bg` | `#1A1A1A` | Sidebar background |
| `sidebar-text` | `#B5C4B8` | Sidebar text |

### Semantic colors

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#28A745` | Success states, completed |
| `warning` | `#F59E0B` | Warning states, pending |
| `danger` | `#EF4444` | Danger actions, cancelled |
| `info` | `#4A9FD8` | Info states, shipped |
| `status-active` | `#10B981` | Active/online indicators |
| `status-inactive` | `#9CA3AF` | Inactive/offline indicators |

## Typography

Tailwind CSS 4 semantic font size classes only. No hardcoded px values.

| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-xs` | 12px | `font-medium` | Table headers, helper text |
| `text-sm` | 14px | `font-normal/medium` | Body, table cells, buttons, inputs |
| `text-base` | 16px | `font-semibold` | Card titles, modal titles |
| `text-lg` | 18px | `font-semibold` | Section subtitles |
| `text-xl` | 20px | `font-bold` | Page titles |
| `text-2xl` | 24px | `font-bold` | Dashboard metric values |

Font families:
- Primary: `Inter`, system-ui, sans-serif
- Mono: `Geist Mono`, ui-monospace, monospace

## Elevation

- Cards and tables: `border border-border` (1px solid)
- Glass modals: `backdrop-filter: blur(16px)` with semi-transparent white background
- Buttons have a subtle `hover: translateY(-1px)` lift via global CSS
- No box-shadow in the design system; elevation is handled through borders and background contrast

## Components

### Buttons

Primary: `rounded bg-primary text-white text-sm font-medium h-10 px-4 hover:bg-primary/90 transition-colors`
Secondary: `rounded border border-border text-text-primary text-sm font-medium h-10 px-4 hover:bg-gray-50 transition-colors`
Danger: `rounded bg-danger text-white text-sm font-medium h-10 px-4 hover:bg-danger/90 transition-colors`

### Inputs

`h-9 rounded border border-border px-3 text-sm text-text-primary bg-white outline-none focus:border-primary transition-colors`

### Tables

- Header: `bg-table-header h-11 shrink-0 sticky top-0`
- Row: `h-[52px] border-b border-border`
- Consistent column widths using fixed-width classes (`w-[80px]`, `w-[120px]`, etc.)

### Modals

Structured as:
```
Teleport to body
  Transition name="modal" (opacity 0.2s)
    fixed inset-0 z-50 flex items-center justify-center
      absolute inset-0 bg-black/50 (backdrop)
      relative glass rounded-md w-[400-560px] border border-border p-7 (container)
```

### Status badges

`rounded-full px-2 py-0.5 text-xs font-medium text-white` with semantic background (success/warning/danger/status-active/status-inactive)

## Do's and Don'ts

- DO use `@theme` tokens for all colors. NO hardcoded hex values in templates.
- DO use semantic Tailwind font size classes. NO `text-[Xpx]`.
- DO use `border-border` for borders. NO custom border colors.
- DO use `h-[52px]` for table rows. NO other heights.
- DO use `h-10` for primary buttons. NO inconsistent heights.
- DO use `StatusBadge` component for status display. NO inline rounded-full spans.
- DO use `bg-table-header` for table headers. NO hardcoded `bg-[#F9FAFB]`.
- DO use `bg-black/50` for modal backdrops. NO other opacity values.
