-- Custom migration: move the device data typed on each service order into
-- `devices`, so every order points to a customer's device.
--
-- 1. Orders store the model as free text. A text that matches no catalog model
--    of the maker (shared or the company's own) becomes a company model, so
--    every device has a real model.
-- 2. Orders of the same customer for the same model and IMEI share a device.
--    Ids are hashes of those values, so the update below finds the same row.
-- 3. The device status follows its orders: in the shop while one is open,
--    waiting for pickup when the repair is ready, otherwise with the customer.
INSERT INTO `models` (`id`, `maker_id`, `name`, `slug`, `url`, `category_id`, `company_id`)
SELECT
	CONCAT('m', SUBSTRING(`legacy`.`hash`, 1, 24)),
	`legacy`.`maker_id`,
	`legacy`.`name`,
	CONCAT('legacy-', SUBSTRING(`legacy`.`hash`, 1, 16)),
	CONCAT('/models/legacy-', SUBSTRING(`legacy`.`hash`, 1, 16)),
	`legacy`.`category_id`,
	`legacy`.`company_id`
FROM (
	SELECT
		`keyed`.`hash`,
		MIN(`keyed`.`company_id`) AS `company_id`,
		MIN(`keyed`.`maker_id`) AS `maker_id`,
		MIN(`keyed`.`model_key`) AS `model_key`,
		MIN(`keyed`.`name`) AS `name`,
		MIN(`keyed`.`category_id`) AS `category_id`
	FROM (
		SELECT
			MD5(CONCAT_WS('|', `so`.`company_id`, `so`.`device_brand_id`, LOWER(TRIM(`so`.`device_model`)))) AS `hash`,
			`so`.`company_id`,
			`so`.`device_brand_id` AS `maker_id`,
			LOWER(TRIM(`so`.`device_model`)) AS `model_key`,
			TRIM(`so`.`device_model`) AS `name`,
			`so`.`device_category_id` AS `category_id`
		FROM `service_orders` AS `so`
		WHERE `so`.`device_id` IS NULL
	) AS `keyed`
	GROUP BY `keyed`.`hash`
) AS `legacy`
WHERE NOT EXISTS (
	SELECT 1
	FROM `models` AS `m`
	WHERE `m`.`maker_id` = `legacy`.`maker_id`
		AND LOWER(`m`.`name`) = `legacy`.`model_key`
		AND (`m`.`company_id` IS NULL OR `m`.`company_id` = `legacy`.`company_id`)
);
--> statement-breakpoint
INSERT INTO `devices` (`id`, `company_id`, `client_id`, `model_id`, `imei`, `status`, `created_at`, `updated_at`)
SELECT
	CONCAT('d', SUBSTRING(`grouped`.`hash`, 1, 24)),
	`grouped`.`company_id`,
	`grouped`.`client_id`,
	(
		SELECT `m`.`id`
		FROM `models` AS `m`
		WHERE `m`.`maker_id` = `grouped`.`maker_id`
			AND LOWER(`m`.`name`) = `grouped`.`model_key`
			AND (`m`.`company_id` IS NULL OR `m`.`company_id` = `grouped`.`company_id`)
		ORDER BY `m`.`company_id` IS NULL, `m`.`created_at`
		LIMIT 1
	),
	`grouped`.`imei`,
	CASE
		WHEN `grouped`.`open_orders` > 0 THEN 'in_shop'
		WHEN `grouped`.`ready_orders` > 0 THEN 'ready_for_pickup'
		ELSE 'with_customer'
	END,
	`grouped`.`created_at`,
	`grouped`.`updated_at`
FROM (
	SELECT
		`keyed`.`hash`,
		MIN(`keyed`.`company_id`) AS `company_id`,
		MIN(`keyed`.`client_id`) AS `client_id`,
		MIN(`keyed`.`maker_id`) AS `maker_id`,
		MIN(`keyed`.`model_key`) AS `model_key`,
		NULLIF(MIN(`keyed`.`imei`), '') AS `imei`,
		SUM(`keyed`.`status` NOT IN ('ready', 'delivered')) AS `open_orders`,
		SUM(`keyed`.`status` = 'ready') AS `ready_orders`,
		MIN(`keyed`.`created_at`) AS `created_at`,
		MAX(`keyed`.`updated_at`) AS `updated_at`
	FROM (
		SELECT
			MD5(CONCAT_WS('|', `so`.`client_id`, `so`.`device_brand_id`, LOWER(TRIM(`so`.`device_model`)), COALESCE(`so`.`imei`, ''))) AS `hash`,
			`so`.`company_id`,
			`so`.`client_id`,
			`so`.`device_brand_id` AS `maker_id`,
			LOWER(TRIM(`so`.`device_model`)) AS `model_key`,
			COALESCE(`so`.`imei`, '') AS `imei`,
			`so`.`status`,
			`so`.`created_at`,
			`so`.`updated_at`
		FROM `service_orders` AS `so`
		WHERE `so`.`device_id` IS NULL
	) AS `keyed`
	GROUP BY `keyed`.`hash`
) AS `grouped`;
--> statement-breakpoint
UPDATE `service_orders` AS `so`
SET `so`.`device_id` = CONCAT('d', SUBSTRING(MD5(CONCAT_WS('|', `so`.`client_id`, `so`.`device_brand_id`, LOWER(TRIM(`so`.`device_model`)), COALESCE(`so`.`imei`, ''))), 1, 24))
WHERE `so`.`device_id` IS NULL;
