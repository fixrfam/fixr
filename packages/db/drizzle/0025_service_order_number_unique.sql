ALTER TABLE `service_orders` MODIFY COLUMN `number` int NOT NULL;--> statement-breakpoint
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_company_number_idx` UNIQUE(`company_id`,`number`);