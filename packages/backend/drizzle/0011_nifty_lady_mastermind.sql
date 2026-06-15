ALTER TABLE `categories` ADD `sort` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `categories_sort_idx` ON `categories` (`sort`);--> statement-breakpoint

UPDATE `categories` SET `sort` = (`id` - 1) WHERE `sort` = 0;
