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
bun install                            # 安装所有依赖

bun --filter @cshop/frontend dev       # 前端开发服务器
bun --filter @cshop/admin dev          # 后台开发服务器
bun --filter @cshop/backend dev        # 后端开发服务器 (Bun)

bun run lint                           # StandardJS 检查
bun run typecheck                      # 类型检查
bun --filter @cshop/<pkg> test         # 运行单个包的测试
bun run build                          # 构建所有包
bun run mask:gen                       # 从 tshirt.png 生成 tshirt-mask.png（设计页换色依赖）
```

## 技术栈铁律

### 前端交互：必须用 SolidJS + AstroJS

所有前端交互逻辑必须使用 SolidJS 组件 + AstroJS 实现，禁止使用内联 `<script>` 标签或 vanilla JS。

| 禁止 ❌ | 必须 ✅ |
|---------|---------|
| `<script>document.querySelector(...)</script>` | `<Component client:load />` |
| `onclick="history.back()"` | `<Button onclick={history.back}>` |
| vanila DOM 操作（classList, style 直接操作） | SolidJS `createSignal` / `createMemo` 状态驱动 |

### 组件化原则

1. **交互即组件**：任何包含用户交互的界面区域，必须封装为 SolidJS 组件，在 Astro 页面中以 `<Component client:load />` 引用。
2. **状态即 Signal**：组件内所有可变状态必须使用 `createSignal` / `createMemo`，禁止直接读写 DOM 属性。
3. **高复用先提取**：一个模式出现 2 次以上的，必须提取为 `src/components/ui/` 下的共享组件。
4. **页面状态容器**：涉及多个信号和衍生状态的页面（如购物车、商店筛选），用 `src/components/page/` 下的容器组件管理。

### 目录结构规范

```
src/components/
├── ui/              # 纯 UI 展示组件（ProductCard, FavoriteButton, SearchInput 等）
├── layout/          # 布局组件（TopAppBar, BottomNavBar）
├── page/            # 页面级状态容器（CartContent, ShopContent, SearchContent）
└── person/          # 个人中心相关组件（ProfileForm, AddressManager 等，按需建子目录）
```

### 响应式设计优先级

项目优先适配移动端，其次为平板，不考虑桌面端：

| 优先级 | 设备 | 断点 | 说明 |
|--------|------|------|------|
| 1 | 手机 (Mobile) | < 768px | **首要适配**，所有功能和样式以移动端为标准设计 |
| 2 | 平板 (Tablet) | 768px - 1024px | 可选增强，使用 `md:` 前缀做响应式适配 |
| 3 | 桌面 (PC) | > 1024px | **不支持**，禁止使用 `lg:` `xl:` `2xl:` 断点及 `max-w-[4-7]xl` 类 |

- 所有新页面和组件必须从移动端布局开始设计，平板适配为可选项
- 禁止优先考虑桌面布局
- 已有 PC 端适配已全部移除

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

## 内置 Skills

- `admin-design` — 改进后台管理页面的设计质量。涉及 `packages/admin/` 的 UI 修改时自动加载。

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

# context-mode — 强制路由规则

context-mode MCP 工具可用。规则保护上下文窗口不被数据淹没。

## Think in Code — 强制

分析/计数/过滤/比较/搜索/解析/转换数据时：**编写代码** 通过 `context-mode_ctx_execute(language, code)`，`console.log()` 只输出答案。不要将原始数据读入上下文。编程式分析，而非计算式。纯 JavaScript — 仅限 Node.js 内置模块（`fs`、`path`、`child_process`）。使用 `try/catch`，处理 `null`/`undefined`。一个脚本替换十个工具调用。

## 禁止 — 不要尝试

### curl / wget — 禁止
Shell `curl`/`wget` 会被拦截。不要再试。
使用：`context-mode_ctx_fetch_and_index(url, source)` 或 `context-mode_ctx_execute(language: "javascript", code: "const r = await fetch(...)")`

### 内联 HTTP — 禁止
`fetch('http`、`requests.get(`、`requests.post(`、`http.get(`、`http.request(` — 会被拦截。不要再试。
使用：`context-mode_ctx_execute(language, code)` — 只有 stdout 进入上下文

### 直接网页抓取 — 禁止
使用：`context-mode_ctx_fetch_and_index(url, source)` 然后 `context-mode_ctx_search(queries)`

## 重定向 — 使用沙箱

### Shell（输出超过 20 行）
Shell 仅用于：`git`、`mkdir`、`rm`、`mv`、`cd`、`ls`、`npm install`、`pip install`。
其他情况：`context-mode_ctx_batch_execute(commands, queries)` 或 `context-mode_ctx_execute(language: "shell", code: "...")`

### 文件读取（用于分析）
读取以 **编辑** → 正确。读取以 **分析/探索/总结** → `context-mode_ctx_execute_file(path, language, code)`。

### grep / 搜索（大量结果）
使用 `context-mode_ctx_execute(language: "shell", code: "grep ...")` 在沙箱中。

## 工具选择

0. **MEMORY**: `context-mode_ctx_search(sort: "timeline")` — 恢复会话后，先查上下文再问用户。
1. **GATHER**: `context-mode_ctx_batch_execute(commands, queries)` — 运行所有命令，自动索引，返回搜索结果。一次调用替代 30+ 次。每条命令：`{label: "header", command: "..."}`。
2. **FOLLOW-UP**: `context-mode_ctx_search(queries: ["q1", "q2", ...])` — 所有问题作为数组，一次调用（默认相关性模式）。
3. **PROCESSING**: `context-mode_ctx_execute(language, code)` | `context-mode_ctx_execute_file(path, language, code)` — 沙箱，只有 stdout 进入上下文。
4. **WEB**: `context-mode_ctx_fetch_and_index(url, source)` 然后 `context-mode_ctx_search(queries)` — 原始 HTML 永不进入上下文。
5. **INDEX**: `context-mode_ctx_index(content, source)` — 存入 FTS5 供后续搜索。

## 并行 I/O 批处理

对于多 URL 抓取或多 API 调用，**始终**包含 `concurrency: N`（1-8）：

- `context-mode_ctx_batch_execute(commands: [3+ 网络命令], concurrency: 5)` — gh、curl、dig、docker inspect、多云区域查询
- `context-mode_ctx_fetch_and_index(requests: [{url, source}, ...], concurrency: 5)` — 多 URL 批量抓取

**I/O 密集型工作使用 concurrency 4-8**（网络调用、API 查询）。**CPU 密集型保持 concurrency 1**（npm test、build、lint）或共享状态命令（端口、锁文件、同仓库写入）。

GitHub API 限速：`gh` 调用上限为 4。

## 输出

产出物写入 **文件** — 永远不要内联。返回：文件路径 + 一行描述。
使用描述性的源标签用于 `search(source: "label")`。

## 会话连续性

技能、角色和决策在整个会话中持续存在。不要随着对话增长而放弃它们。

## 记忆

会话历史是持久的且可搜索。恢复会话时，先搜索再问用户：

| 需求 | 命令 |
|------|------|
| 我们之前决定了什么？ | `context-mode_ctx_search(queries: ["decision"], source: "decision", sort: "timeline")` |
| 存在哪些约束？ | `context-mode_ctx_search(queries: ["constraint"], source: "constraint")` |

不要问"我们之前在做什么？" — **先搜索**。
如果搜索返回 0 条结果，作为新会话处理。

## ctx 命令

| 命令 | 操作 |
|------|------|
| `ctx stats` | 调用 `stats` MCP 工具，完整显示输出 |
| `ctx doctor` | 调用 `doctor` MCP 工具，运行返回的 shell 命令，以检查清单显示 |
| `ctx upgrade` | 调用 `upgrade` MCP 工具，运行返回的 shell 命令，以检查清单显示 |
| `ctx purge` | 调用 `purge` MCP 工具（confirm: true）。清空知识库前警告。 |

/clear 或 /compact 后：知识库和会话统计保留。使用 `ctx purge` 完全重置。**注意**：本项目中包管理器使用 `bun`，而非 `npm`/`pnpm`。
