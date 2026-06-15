减少按钮的重复提交
规格使用表格，规模化修改

---

## 规格选项扩展（配件类商品）

### 背景
当前 size/color/material/weight 4 个规格类型在后端 schema、validator、route cast 和前端 OptionType、optionTypeDefs 等多处写死。配件类商品（如香水、饰品）需要不同规格类型（容量、香型、长度、款式等）。

### 方案选择

#### 方案 A：完全动态（attributes JSON）
- `product_variants.attributes: json` 替代固定列
- 优点：真正任意组合，不用改 schema
- 缺点：SQL 查询/索引能力下降，改造工作量大

#### 方案 B：固定列 + 通用键值对（推荐短期方案）
- 保留 size/color/material/weight 列
- 新增 `extra: json` 字段存额外属性
- 优点：现有逻辑不变，新规格塞 extra
- 缺点：搜索只能按 size/color

#### 方案 C：扩展固定类型（保守）
- 枚举扩展到 6-8 种（scent、capacity 等）
- 对应 `product_variants` 表加列
- 优点：改动最小，SQL 可查
- 缺点：仍写死，表会越来越宽

#### 方案 D：UI 动态 + 后端 JSON（推荐长期方案）
- 前端 tabs 改"动态增删"
- 后端 product_variants 用 JSON
- 优点：真正自定义
- 缺点：工作量大，数据迁移

### 决策
- 短期：方案 B（加 extra JSON 字段）
- 长期：方案 D（如果业务规模化）

### 待解决问题
1. 配件类商品具体需要哪些新规格？香型/容量/长度/款式？
2. 批量生成是否扩展为 N 维笛卡尔？size × color × capacity 会爆炸
3. 是否做规格模板化？（"T恤模板"=[尺寸,颜色]，"香水模板"=[容量,香型]）

### 影响范围
后端：schema.ts、validators/index.ts、routes（5 处 enum）
前端：ProductFormPage.vue（9 处写死 size/color/material/weight）

---

## 库存数量自动汇总（进行中）

### 目标
- 「库存数量」字段变只读
- 自动从 variants.stock 累加显示
- 保存时仍传 stock=totalStock（保持数据库一致）

### 改动
- ProductFormPage.vue:104-110 改为只读 div
- 新增 computed `totalStock` = sum of variants.stock
- loadProduct 时不再需要 form.stock = d.stock
- saveStep1 payload.stock = totalStock

---

## users / staff 物理拆表（待评估）

### 背景
- 现状：方案 Y 已落地——`users` 表删 `role` 字段，靠 `isNull(staff.id)` 区分身份
- 痛点：`users` 表里仍存 admin 账号（id=1 Administrator）——任何 `SELECT * FROM users` 都会看到
- 设计原因：admin 必须是 `users` 里的 user（staff.userId 1:1 引用、登录 JWT 需要、orders/cart_items/designs.userId 可能引用）

### 方案 Z 备选（未做）
- 新建 `admins` 表（id, email, passwordHash, name, roleId, ...），独立存管理员账号
- `users` 只存顾客
- 登录流程：先查 `users`，未命中再查 `admins`
- `loadStaffContext` 改查 `admins`，`requireStaff` 中间件改名为 `requireAdmin`（或保留名换表）
- JWT `userId` 对 admin 改为 `admins.id`（user/userId 字段语义需重新设计）
- 所有 FK（cart_items, orders, designs, staff）保持不变

### 决策
- 当前：Y（不动）
- 后续：观察 DB 层面的「混」是否影响业务或安全，决定是否升级到 Z

### 待解决问题
1. `staff.userId` 引用 `users.id` 怎么处理？（拆表后 `admins` 没有 userId）
2. `requireStaff` 中间件名是否同步改名？
3. JWT payload 里 `userId` 含义对 admin 来说变成 `adminId`，前端 `/auth/me` 怎么对齐？
4. 数据迁移：现有 admin 行的 passwordHash/email/name 怎么搬到 `admins` 表？
5. 影响面估计：~200-300 行代码改动 + 1 周测试

### 影响范围（待定）
后端：schema.ts（删 staff 表、新建 admins）、auth.ts（登录流程）、middleware/auth.ts、middleware/permission.ts、utils/staff.ts、utils/jwt.ts、scripts/init-admin.ts、tests 全套
前端：登录页、TopBar、useAuth composable、所有 useUserId 的地方

### 触发重新评估的条件
- 「查 users 表」成为安全问题（审计/合规要求 admin 不和 customer 共享表）
- 业务方明确要求 admin 不能通过 customer 表的任何路径触及
- staff 字段（department/position/hiredAt）和 users 字段（disabled/lastLoginAt）出现更多字段冲突

---

## 通知系统：邮件 + 短信通道（部分完成）

### 现状
- 后端 `src/utils/notify.ts` 已实现 `sendNotification(event, subject, message)`
- 读取 4 个 setting：`notify_${event}`（事件开关）+ `notify_email` / `notify_sms`（通道）+ `notify_receive_email`（收件人）
- 通道优先级：email 优先于 sms（互斥，默认 email）
- 3 个事件钩子：
  - `routes/orders.ts` 下单成功 → `new_order`
  - `routes/orders.ts` 扣减库存后 → `stock_alert`（阈值 5，硬编码）
  - `routes/auth.ts` 注册成功 → `user_register`
- 前端 SettingsPage 通知 tab 加了「互斥」逻辑（toggleEmailNotify / toggleSmsNotify）
- 邮件 + 短信都是 `console.log` 模拟输出

### 还没做（TODO）
1. **真实邮件发送**：接 SMTP（推荐 `Bun.smtp` 或 nodemailer），配置 host/port/user/pass 走 env（`SMTP_HOST` 等）
2. **真实短信发送**：接短信网关（Twilio / 阿里云 / 腾讯云），需要：
   - `users.phone` 字段（当前 schema 没有）
   - 网关 API key 走 env
3. **库存预警阈值做成 setting**（当前硬编码 `STOCK_ALERT_THRESHOLD = 5`）：加 `stock_alert_threshold` setting
4. **多收件人**：当前只支持单一 `notify_receive_email`，需要 `users.staff` 角色「管理员」全部收通知
5. **通知历史表**：每次发通知写 `notification_log` 表（event/channel/recipient/status/sent_at），UI 可看发送历史
6. **失败重试**：邮件/SMS 失败的指数退避重试
7. **模板化**：subject/message 现在是调用方传字符串，应该走模板系统（事件类型 → 模板 ID → 渲染变量）
8. **测试事件触发**：注册 1 个用户 → 看 console；下 1 个单 → 看 console；库存低时再下 1 单 → 看 stock_alert
9. **批量事件去重**：同一订单 5 行都触发 stock_alert 应该合并成 1 条（已经有去重，但需要测试）

### 影响范围
后端：utils/notify.ts、orders.ts、auth.ts、settings.ts（DEFAULTS 加 stock_alert_threshold）
前端：todo 等真实通道接入后再做 UI 调整

### 决策
- 当前：模拟输出（开发期足够）
- 短期：加 `stock_alert_threshold` setting
- 中期：接 SMTP（邮件是真需求，短信优先级低）
- 长期：完整通知中心 + 历史 + 模板

---

## 邮箱激活 / 验证（未实现）

### 现状
- `users` 表已有 `emailVerifiedAt` 字段（`email_verified_at`），但**全代码库无任何使用**
- 注册时直接登录，没验证邮箱真伪
- 找回密码流程假动作（`forgot-password` 只 console.log，没真发邮件）

### 目标
注册后强制走验证流程，未验证邮箱的用户：
- 可以登录但功能受限（如下单、收藏、评论）
- 收到一封验证邮件（复用现有 SMTP 通道）
- 点链接 → 写 `email_verified_at = NOW()` → 解锁全功能

### 需要新增

#### 后端
1. **token 表** `email_verifications`
   ```sql
   CREATE TABLE email_verifications (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER NOT NULL,
     token TEXT NOT NULL UNIQUE,        -- crypto.randomUUID() 或 32 字节 base64
     expires_at TEXT NOT NULL,          -- 24h 后
     used_at TEXT,                      -- 用了就标
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   );
   CREATE INDEX email_verifications_token_idx ON email_verifications(token);
   CREATE INDEX email_verifications_user_idx ON email_verifications(user_id);
   ```

2. **新端点**
   - `POST /api/v1/auth/verify-email`（body: `{token}`）—— 验证后写 `email_verified_at`
   - `POST /api/v1/auth/resend-verification`（auth）—— 重新发验证邮件（限流 1/分钟/用户）
   - 现有 `forgot-password` 改造：真发邮件 + 验证 token + 重置密码

3. **现有端点改动**
   - `POST /api/v1/auth/register`：注册成功**不直接登录**，返 `{needVerification: true, email}`，前端跳「请查收邮件」页
   - `POST /api/v1/auth/login`：登录成功时 `user.emailVerifiedAt` 加进 JWT payload，TTL 短（如 7d）
   - `POST /api/v1/auth/refresh`：`emailVerifiedAt` 改了就拒绝 refresh
   - JWT payload 加 `emailVerifiedAt` 字段
   - 新 middleware `requireEmailVerified`：未验证返 403 + `{code: 'EMAIL_NOT_VERIFIED'}`

4. **邮件模板**（用 `utils/notify.ts` 的 sendEmail）
   - subject: `=?utf-8?B?{base64}?= 验证您的 CShop 邮箱`
   - body 含验证链接：`https://shop.example.com/verify?token=xxx`
   - 链接有效期 + 「没收到？」提示
   - 链接域名走 env `FRONTEND_URL`（默认 `http://localhost:4321`）

5. **配置**（加 .env.local + .env.example）
   ```
   FRONTEND_URL=http://localhost:4321
   EMAIL_VERIFY_TTL_HOURS=24
   EMAIL_VERIFY_REQUIRED=false  # 默认 false（开发期不强制），生产改 true
   ```

6. **cron 清理**（lazy 模式）
   - `email_verifications.expires_at < now() AND used_at IS NULL` 每天扫一次删（复用 `eventQueue.lazyClean`）

#### 前端
1. **「请查收邮件」页**（新页面 `VerifyEmailPage`）
   - 提示用户去邮箱查收
   - 「没收到？重新发送」按钮（带倒计时防刷）
   - 邮件里点链接跳 `/verify?token=xxx` → 自动调 verify-email API → 成功跳首页
2. **登录响应处理**：`needVerification: true` 时跳「请查收邮件」页（不跳首页）
3. **个人中心**：邮箱后加「✓ 已验证」 / 「未验证 → 重新发送」徽章
4. **功能拦截弹窗**：下单单 / 评论 / 收藏时如果 `EMAIL_NOT_VERIFIED` → 弹「请先验证邮箱」+ 一键跳转

#### 测试场景
- 注册 → 收到验证邮件 → 点链接 → `email_verified_at` 写入 → 再下单成功
- 注册 → 不点链接 → 尝试下单 → 返 403 + 弹窗
- 链接过期（24h 后）→ 返 410 Gone → 提示「重新发送」
- 重新发送 1/分钟限流：第 2 次点击 429 → toast「请等待 30s」
- 已验证用户重发：返 200 但不发（status=already_verified）

### 影响范围
后端：schema.ts 加 email_verifications 表、auth.ts 4 处改动、middleware/ 加 requireEmailVerified、utils/notify.ts 加 sendVerificationEmail、validators 加 verifyEmailSchema、eventQueue.lazyClean 加清理
前端：auth flow 改、个人中心加徽章、新 VerifyEmailPage、拦截弹窗
数据库：迁移 0017 email_verifications.sql

### 决策
- 当前：完全不做（emailVerifiedAt 字段闲着）
- 短期：先做 token 表 + 邮件发送 + 验证端点，**不强制**（EMAIL_VERIFY_REQUIRED=false）
- 中期：上线后打开 EMAIL_VERIFY_REQUIRED=true，强制未验证用户走完流程
- 长期：发件人信誉/IP 池（避免进垃圾箱）、bounce 处理、退订链接

### 触发实现的条件
- 真用户开始注册（不再只是测试数据）
- 风控/合规要求验证邮箱（如 PCI/隐私法）
- 找回密码需要真发送