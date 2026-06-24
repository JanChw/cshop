ALTER TABLE `stickers` ADD COLUMN `user_id` INTEGER REFERENCES `users`(`id`) ON DELETE CASCADE;
CREATE INDEX `stickers_user_idx` ON `stickers` (`user_id`);
