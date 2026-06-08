# AGENTS.md

## Tech Stack

| Layer | Technology |
|-------|-----------|
| 前端 (店铺) | SolidJS 1.9.x + Astro 6.x + Tailwind CSS 4.x + Fabric.js |
| 后台管理 | Vue.js + Tailwind CSS |
| 后端 | Bun + Hono + SQLite + 本地文件存储 |
| 包管理器 | bun (不用 npm/pnpm) |
| 代码规范 | StandardJS |

## 项目结构

```
packages/
  frontend/    # SolidJS + Astro (客户前端)
  admin/       # Vue.js (后台管理)
  backend/     # Bun + Hono (API 服务)
```

## 常用命令

```bash
bun install                     # 安装所有依赖

bun --filter frontend dev       # 前端开发服务器
bun --filter admin dev          # 后台开发服务器
bun --filter backend dev        # 后端开发服务器 (Bun)

bun run lint                    # StandardJS 检查
bun run typecheck               # 类型检查
bun --filter <pkg> test         # 运行单个包的测试
bun run build                   # 构建所有包
```

## 关键约定

- **运行时**：后端脚本用 `bun` 执行，不用 `node`。
- **包管理器**：始终用 `bun`。`npm install` 或 `pnpm install` 会失败。
- **数据库**：SQLite，开启 WAL 模式 + 外键约束。单机完全够用，无需外部数据库服务。
- **Drizzle ORM**：数据库操作用 Drizzle ORM + `bun:sqlite` 驱动，Schema 定义在 TypeScript 中。
- **文件上传**：存储在本地文件系统，非云端存储（S3 等）。
- **Tailwind v4**：使用 CSS-first 配置，无 `tailwind.config.js`，配置写在 CSS 的 `@theme` 中。
- **Fabric.js**：仅客户端运行。Astro SSR 中不可直接引入，需用 `client:only` 或动态 import。
- **图片处理**：上传时用 `sharp` 生成 4 个 WebP 变体（thumb/small/medium/large），
  前端用 `srcset` + `sizes` 按设备宽度自适应加载。静态文件返回 `Cache-Control: immutable`。
- **API 设计**：RESTful，`/api/v1/` 前缀；统一响应 `{ success, data, error }`；请求体用 Zod 校验。
- **定时任务**：不引入独立调度器。过期订单、孤立文件用"懒清理"策略（查询时检测清理）。
  后续如需定时任务，Bun 进程内 `setInterval` 即可。

## 语言要求

- **回复语言**：始终使用中文回复用户。

## 行为准则

**以下四个原则来自 Karpathy 的 LLM 编码陷阱观察，对所有代码修改操作有效。它们偏向谨慎而非速度 —— 简单任务自行裁量。**

### 1. 编码前先思考

不假设，不隐藏困惑，呈现权衡。

- 明确写出假设；不确定就问。
- 存在歧义时列出多种解读，不要擅自选一个。
- 有更简单的方案就说出来，该反驳时反驳。
- 不清楚的地方停下来，指出困惑点，然后问。

### 2. 简洁优先

最少代码解决问题。不写推测性代码。

- 不添加需求之外的功能。
- 不为一次性代码创建抽象。
- 不添加未要求的"灵活性"或"可配置性"。
- 不为不可能发生的场景写错误处理。
- 200 行能写成 50 行就重写。

**检验标准：** 资深工程师会觉得过度复杂吗？如果是，简化。

### 3. 精准修改

只改必须改的。只清理自己造成的混乱。

- 不要"优化"相邻的代码、注释或格式。
- 不要重构没坏的东西。
- 匹配现有风格，即使用自己的偏好不同。
- 注意到无关的死代码时提一下，不要删除。
- 因你的改动而产生的死代码（import/变量/函数）要清理。
- 未经要求不删除之前就存在的死代码。

**检验标准：** 每一行改动都应能直接追溯到用户请求。

### 4. 目标驱动执行

定义成功标准，循环验证直到达成。

| 不要这样写... | 转化为... |
|--------------|---------|
| "添加验证" | "为无效输入编写测试，然后让它们通过" |
| "修复 bug" | "编写重现 bug 的测试，然后让它通过" |
| "重构 X" | "确保重构前后测试都能通过" |

多步骤任务给出简短计划：
```
1. [步骤] → 验证: [检查]
2. [步骤] → 验证: [检查]
3. [步骤] → 验证: [检查]
```

## 如何判断准则生效

- diff 中不必要的改动变少
- 因过度复杂而重写的次数减少
- 澄清问题在犯错之前提出
- PR 干净精炼，没有顺带的重构
