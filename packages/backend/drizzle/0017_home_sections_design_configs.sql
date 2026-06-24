CREATE TABLE `home_sections` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `type` TEXT NOT NULL,
  `data` TEXT NOT NULL,
  `title` TEXT,
  `sort` INTEGER NOT NULL DEFAULT 0,
  `is_active` INTEGER NOT NULL DEFAULT 1,
  `created_at` TEXT NOT NULL DEFAULT (datetime('now')),
  `updated_at` TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX `home_sections_sort_idx` ON `home_sections`(`sort`);

CREATE TABLE `design_configs` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `config_group` TEXT NOT NULL,
  `name` TEXT NOT NULL,
  `value` TEXT NOT NULL,
  `extra` TEXT,
  `sort` INTEGER NOT NULL DEFAULT 0,
  `is_active` INTEGER NOT NULL DEFAULT 1,
  `created_at` TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX `design_configs_group_idx` ON `design_configs`(`config_group`, `sort`);
