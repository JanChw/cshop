ALTER TABLE `users` ADD `status` text DEFAULT 'active' NOT NULL;--> statement-breakpoint
UPDATE `users` SET `status` = 'disabled' WHERE `disabled` = 1;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `disabled`;
