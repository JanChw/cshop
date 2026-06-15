ALTER TABLE `products` ADD `deleted_at` text;--> statement-breakpoint
CREATE INDEX `products_deleted_idx` ON `products` (`deleted_at`);--> statement-breakpoint

INSERT INTO `permissions` (`code`, `module`, `description`)
VALUES ('product.hardDelete', 'product', '彻底删除商品');--> statement-breakpoint

INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p
WHERE r.name = 'super_admin' AND p.code = 'product.hardDelete';--> statement-breakpoint

INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p
WHERE r.name = 'product_mgr' AND p.code = 'product.hardDelete';
