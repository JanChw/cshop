ALTER TABLE `product_variants` ADD `created_at` text DEFAULT (datetime('now')) NOT NULL;--> statement-breakpoint
ALTER TABLE `product_variants` ADD `updated_at` text DEFAULT (datetime('now')) NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `updated_at` text DEFAULT (datetime('now')) NOT NULL;