CREATE INDEX `activity_events_type_created_idx` ON `activity_events` (`event_type`,`created_at`);--> statement-breakpoint
CREATE INDEX `cart_product_idx` ON `cart_items` (`product_id`);--> statement-breakpoint
CREATE INDEX `cart_variant_idx` ON `cart_items` (`variant_id`);--> statement-breakpoint
CREATE INDEX `designs_product_idx` ON `designs` (`product_id`);--> statement-breakpoint
CREATE INDEX `designs_variant_idx` ON `designs` (`variant_id`);--> statement-breakpoint
CREATE INDEX `order_items_product_idx` ON `order_items` (`product_id`);--> statement-breakpoint
CREATE INDEX `order_items_variant_idx` ON `order_items` (`variant_id`);--> statement-breakpoint
CREATE INDEX `orders_user_created_idx` ON `orders` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `orders_status_created_idx` ON `orders` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `variants_product_size_idx` ON `product_variants` (`product_id`,`size`,`color`);--> statement-breakpoint
CREATE INDEX `uploads_user_created_idx` ON `uploads` (`user_id`,`created_at`);