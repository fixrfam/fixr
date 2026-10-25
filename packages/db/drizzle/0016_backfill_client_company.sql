-- Custom migration: scope the customers created before company_id existed.
-- Each legacy client is assigned to the company of its oldest service order.
-- Clients without any service order keep company_id NULL and stay hidden from
-- the company-scoped API (they are still readable as a login profile).
UPDATE `clients` AS `c`
SET `c`.`company_id` = (
	SELECT `so`.`company_id`
	FROM `service_orders` AS `so`
	WHERE `so`.`client_id` = `c`.`id`
	ORDER BY `so`.`created_at` ASC
	LIMIT 1
)
WHERE `c`.`company_id` IS NULL;
