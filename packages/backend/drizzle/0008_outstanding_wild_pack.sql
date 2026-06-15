CREATE TABLE `variant_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`value` text NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `variant_options_type_idx` ON `variant_options` (`type`,`sort`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_menus` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`parent_id` integer,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`icon` text,
	`sort` integer DEFAULT 0 NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`type` text DEFAULT 'admin' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_menus`("id", "parent_id", "name", "path", "icon", "sort", "is_visible", "type", "created_at") SELECT "id", "parent_id", "name", "path", "icon", "sort", "is_visible", "type", "created_at" FROM `menus`;--> statement-breakpoint
DROP TABLE `menus`;--> statement-breakpoint
ALTER TABLE `__new_menus` RENAME TO `menus`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `menus_parent_idx` ON `menus` (`parent_id`);--> statement-breakpoint
CREATE INDEX `menus_sort_idx` ON `menus` (`sort`);