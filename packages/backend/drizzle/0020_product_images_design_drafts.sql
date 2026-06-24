ALTER TABLE `products` ADD COLUMN `front_image` TEXT;
ALTER TABLE `products` ADD COLUMN `mask_image` TEXT;

CREATE TABLE `design_drafts` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `user_id` INTEGER NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `product_id` INTEGER NOT NULL REFERENCES `products`(`id`),
  `variant_id` INTEGER REFERENCES `product_variants`(`id`),
  `name` TEXT,
  `canvas_data` TEXT NOT NULL,
  `preview_image` TEXT,
  `created_at` TEXT NOT NULL DEFAULT (datetime('now')),
  `updated_at` TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX `design_drafts_user_idx` ON `design_drafts` (`user_id`);
CREATE INDEX `design_drafts_product_idx` ON `design_drafts` (`product_id`);
