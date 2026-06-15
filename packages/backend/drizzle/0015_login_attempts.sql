CREATE TABLE `login_attempts` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `email` TEXT NOT NULL,
  `ip` TEXT,
  `success` INTEGER NOT NULL,
  `user_agent` TEXT,
  `created_at` TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX `login_attempts_email_idx` ON `login_attempts`(`email`, `created_at`);
CREATE INDEX `login_attempts_ip_idx` ON `login_attempts`(`ip`, `created_at`);
