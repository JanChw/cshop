CREATE TABLE `activity_event_refs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`product_id` integer,
	`product_name` text,
	FOREIGN KEY (`event_id`) REFERENCES `activity_events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `activity_event_refs_event_idx` ON `activity_event_refs` (`event_id`);--> statement-breakpoint
CREATE INDEX `activity_event_refs_product_idx` ON `activity_event_refs` (`product_id`);--> statement-breakpoint
CREATE TABLE `daily_stats` (
	`date` text PRIMARY KEY NOT NULL,
	`pv` integer DEFAULT 0 NOT NULL,
	`dau` integer DEFAULT 0 NOT NULL,
	`product_views` integer DEFAULT 0 NOT NULL,
	`cart_adds` integer DEFAULT 0 NOT NULL,
	`order_creates` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_daily_views` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`date` text NOT NULL,
	`views` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `product_daily_views_product_date_idx` ON `product_daily_views` (`product_id`,`date`);--> statement-breakpoint
CREATE INDEX `product_daily_views_date_idx` ON `product_daily_views` (`date`);--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`path` text NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `product_images_product_sort_idx` ON `product_images` (`product_id`,`sort`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_design_drafts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`variant_id` integer,
	`name` text,
	`canvas_data` text,
	`canvas_path` text,
	`preview_image` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_design_drafts`("id", "user_id", "product_id", "variant_id", "name", "canvas_data", "canvas_path", "preview_image", "created_at", "updated_at") SELECT "id", "user_id", "product_id", "variant_id", "name", "canvas_data", "canvas_path", "preview_image", "created_at", "updated_at" FROM `design_drafts`;--> statement-breakpoint
DROP TABLE `design_drafts`;--> statement-breakpoint
ALTER TABLE `__new_design_drafts` RENAME TO `design_drafts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `design_drafts_user_idx` ON `design_drafts` (`user_id`);--> statement-breakpoint
CREATE INDEX `design_drafts_product_idx` ON `design_drafts` (`product_id`);--> statement-breakpoint
CREATE TABLE `__new_designs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`variant_id` integer,
	`name` text NOT NULL,
	`canvas_data` text,
	`canvas_path` text,
	`preview_image` text,
	`is_public` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_designs`("id", "user_id", "product_id", "variant_id", "name", "canvas_data", "canvas_path", "preview_image", "is_public", "created_at", "updated_at") SELECT "id", "user_id", "product_id", "variant_id", "name", "canvas_data", "canvas_path", "preview_image", "is_public", "created_at", "updated_at" FROM `designs`;--> statement-breakpoint
DROP TABLE `designs`;--> statement-breakpoint
ALTER TABLE `__new_designs` RENAME TO `designs`;--> statement-breakpoint
CREATE INDEX `designs_user_idx` ON `designs` (`user_id`);--> statement-breakpoint
CREATE INDEX `designs_product_idx` ON `designs` (`product_id`);--> statement-breakpoint
CREATE INDEX `designs_variant_idx` ON `designs` (`variant_id`);