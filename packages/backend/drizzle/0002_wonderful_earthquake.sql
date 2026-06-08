CREATE TABLE `activity_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`event_type` text NOT NULL,
	`path` text NOT NULL,
	`method` text,
	`status_code` integer,
	`duration` integer,
	`ip` text,
	`user_agent` text,
	`device_type` text DEFAULT 'desktop' NOT NULL,
	`country` text,
	`region` text,
	`city` text,
	`metadata` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `activity_events_user_idx` ON `activity_events` (`user_id`);--> statement-breakpoint
CREATE INDEX `activity_events_type_idx` ON `activity_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `activity_events_created_idx` ON `activity_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `activity_events_country_idx` ON `activity_events` (`country`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_online` (
	`user_id` integer NOT NULL,
	`device_type` text DEFAULT 'desktop' NOT NULL,
	`login_at` text NOT NULL,
	`last_active_at` text NOT NULL,
	`ip` text,
	`user_agent` text,
	`country` text,
	`region` text,
	`city` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_online_pk` ON `user_online` (`user_id`,`device_type`);