RENAME TABLE `clients` TO `customers`;--> statement-breakpoint
ALTER TABLE `estimates` RENAME COLUMN `client_id` TO `customer_id`;--> statement-breakpoint
ALTER TABLE `service_orders` RENAME COLUMN `client_id` TO `customer_id`;--> statement-breakpoint
ALTER TABLE `portal_links` RENAME COLUMN `client_id` TO `customer_id`;--> statement-breakpoint
ALTER TABLE `portal_sessions` RENAME COLUMN `client_id` TO `customer_id`;--> statement-breakpoint
ALTER TABLE `customers` DROP FOREIGN KEY `clients_company_id_companies_id_fk`;
--> statement-breakpoint
ALTER TABLE `customers` DROP FOREIGN KEY `clients_user_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `estimates` DROP FOREIGN KEY `estimates_client_id_clients_id_fk`;
--> statement-breakpoint
ALTER TABLE `service_orders` DROP FOREIGN KEY `service_orders_client_id_clients_id_fk`;
--> statement-breakpoint
ALTER TABLE `portal_links` DROP FOREIGN KEY `portal_links_client_id_clients_id_fk`;
--> statement-breakpoint
ALTER TABLE `portal_sessions` DROP FOREIGN KEY `portal_sessions_client_id_clients_id_fk`;
--> statement-breakpoint
DROP INDEX `portal_links_client_idx` ON `portal_links`;--> statement-breakpoint
ALTER TABLE `customers` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `customers` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `estimates` ADD CONSTRAINT `estimates_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portal_links` ADD CONSTRAINT `portal_links_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portal_sessions` ADD CONSTRAINT `portal_sessions_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `portal_links_customer_idx` ON `portal_links` (`customer_id`);