CREATE TABLE `permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`module` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_code_unique` ON `permissions` (`code`);--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` integer NOT NULL,
	`permission_id` integer NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `role_permissions_pk` ON `role_permissions` (`role_id`,`permission_id`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`description` text,
	`is_system` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE TABLE `staff` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`role_id` integer NOT NULL,
	`employee_no` text,
	`department` text,
	`position` text,
	`status` text DEFAULT 'active' NOT NULL,
	`hired_at` text,
	`last_login_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_user_id_unique` ON `staff` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `staff_employee_no_unique` ON `staff` (`employee_no`);--> statement-breakpoint
CREATE INDEX `staff_role_idx` ON `staff` (`role_id`);--> statement-breakpoint
CREATE INDEX `staff_status_idx` ON `staff` (`status`);--> statement-breakpoint

-- Seed default roles
INSERT INTO `roles` (`name`, `display_name`, `description`, `is_system`) VALUES
  ('super_admin', '超级管理员', '拥有全部权限', 1),
  ('product_mgr', '商品管理员', '负责商品和分类管理', 1),
  ('order_mgr', '订单管理员', '负责订单处理', 1),
  ('analytics_viewer', '数据观察员', '仅查看分析数据', 1);--> statement-breakpoint

-- Seed default permissions
INSERT INTO `permissions` (`code`, `module`, `description`) VALUES
  ('product.create', 'product', '创建商品'),
  ('product.read', 'product', '查看商品'),
  ('product.update', 'product', '更新商品'),
  ('product.delete', 'product', '删除商品'),
  ('order.read', 'order', '查看订单'),
  ('order.update_status', 'order', '更新订单状态'),
  ('user.read', 'user', '查看用户'),
  ('user.update', 'user', '更新用户'),
  ('user.disable', 'user', '禁用用户'),
  ('analytics.read', 'analytics', '查看分析数据'),
  ('analytics.export', 'analytics', '导出分析数据'),
  ('staff.read', 'staff', '查看员工'),
  ('staff.create', 'staff', '创建员工'),
  ('staff.update', 'staff', '更新员工'),
  ('staff.delete', 'staff', '删除员工'),
  ('settings.read', 'settings', '查看设置'),
  ('settings.update', 'settings', '更新设置'),
  ('category.create', 'category', '创建分类'),
  ('category.update', 'category', '更新分类'),
  ('category.delete', 'category', '删除分类'),
  ('sticker.create', 'sticker', '创建贴纸'),
  ('sticker.update', 'sticker', '更新贴纸'),
  ('sticker.delete', 'sticker', '删除贴纸'),
  ('backup.create', 'backup', '创建备份'),
  ('backup.download', 'backup', '下载备份'),
  ('backup.delete', 'backup', '删除备份');--> statement-breakpoint

-- Bind all permissions to super_admin
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p WHERE r.name = 'super_admin';--> statement-breakpoint

-- Bind product permissions to product_mgr
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p
WHERE r.name = 'product_mgr' AND p.code IN (
  'product.create', 'product.read', 'product.update', 'product.delete',
  'category.create', 'category.update', 'category.delete',
  'sticker.create', 'sticker.update', 'sticker.delete',
  'analytics.read'
);--> statement-breakpoint

-- Bind order permissions to order_mgr
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p
WHERE r.name = 'order_mgr' AND p.code IN (
  'order.read', 'order.update_status', 'user.read', 'analytics.read'
);--> statement-breakpoint

-- Bind analytics permissions to analytics_viewer
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p
WHERE r.name = 'analytics_viewer' AND p.code IN (
  'analytics.read', 'product.read', 'order.read'
);--> statement-breakpoint

-- Migrate existing admin users to staff with super_admin role
INSERT INTO `staff` (`user_id`, `role_id`, `status`, `hired_at`, `created_at`, `updated_at`)
SELECT u.id, r.id, 'active', datetime('now'), datetime('now'), datetime('now')
FROM `users` u, `roles` r
WHERE u.role = 'admin' AND r.name = 'super_admin';