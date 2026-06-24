ALTER TABLE `products` ADD COLUMN `images` TEXT;

UPDATE `products` SET `images` = CASE
  WHEN `image` IS NOT NULL AND `image` != '' THEN json_array(`image`)
  ELSE '[]'
END;
