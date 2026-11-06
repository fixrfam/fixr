-- Custom migration: number the existing service orders and give them a
-- status history.
--
-- 1. Each company's orders are numbered 1, 2, 3... in the order they were
--    opened, and the company's sequence continues from the last one.
-- 2. Every order gets the entry of its opening (by the technician who opened
--    it) and, when it already moved, one entry to its current status. Ids are
--    hashes of the order id, like the devices backfill.
UPDATE `service_orders` AS `so`
INNER JOIN (
	SELECT
		`id`,
		ROW_NUMBER() OVER (PARTITION BY `company_id` ORDER BY `created_at`, `id`) AS `n`
	FROM `service_orders`
) AS `numbered` ON `numbered`.`id` = `so`.`id`
SET `so`.`number` = `numbered`.`n`
WHERE `so`.`number` IS NULL;
--> statement-breakpoint
INSERT INTO `service_order_sequences` (`company_id`, `last_number`)
SELECT `company_id`, MAX(`number`)
FROM `service_orders`
GROUP BY `company_id`;
--> statement-breakpoint
INSERT INTO `service_order_history` (`id`, `service_order_id`, `from_status`, `to_status`, `employee_id`, `created_at`)
SELECT
	CONCAT('h', SUBSTRING(MD5(CONCAT(`so`.`id`, '|opened')), 1, 24)),
	`so`.`id`,
	NULL,
	'pending',
	`so`.`employee_id`,
	`so`.`created_at`
FROM `service_orders` AS `so`;
--> statement-breakpoint
INSERT INTO `service_order_history` (`id`, `service_order_id`, `from_status`, `to_status`, `employee_id`, `created_at`)
SELECT
	CONCAT('h', SUBSTRING(MD5(CONCAT(`so`.`id`, '|current')), 1, 24)),
	`so`.`id`,
	'pending',
	`so`.`status`,
	NULL,
	`so`.`updated_at`
FROM `service_orders` AS `so`
WHERE `so`.`status` <> 'pending';
