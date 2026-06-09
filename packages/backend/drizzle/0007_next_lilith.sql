CREATE TABLE `menus` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`parent_id` integer,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`icon` text,
	`sort` integer DEFAULT 0 NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`type` text DEFAULT 'admin' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `menus`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `menus_parent_idx` ON `menus` (`parent_id`);--> statement-breakpoint
CREATE INDEX `menus_sort_idx` ON `menus` (`sort`);--> statement-breakpoint
INSERT INTO `permissions` (`code`, `module`, `description`) VALUES
('menu.read', 'menu', '查看菜单'),
('menu.create', 'menu', '创建菜单'),
('menu.update', 'menu', '更新/排序菜单'),
('menu.delete', 'menu', '删除菜单');--> statement-breakpoint
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p
WHERE r.name = 'super_admin' AND p.code LIKE 'menu.%';--> statement-breakpoint
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p
WHERE r.name IN ('product_mgr', 'order_mgr', 'analytics_viewer') AND p.code = 'menu.read';