ALTER TABLE `service_orders` DROP FOREIGN KEY `service_orders_device_brand_id_model_makers_id_fk`;
--> statement-breakpoint
ALTER TABLE `service_orders` DROP FOREIGN KEY `service_orders_device_category_id_model_categories_id_fk`;
--> statement-breakpoint
ALTER TABLE `service_orders` MODIFY COLUMN `device_id` varchar(25) NOT NULL;--> statement-breakpoint
ALTER TABLE `service_orders` DROP COLUMN `device_brand_id`;--> statement-breakpoint
ALTER TABLE `service_orders` DROP COLUMN `device_category_id`;--> statement-breakpoint
ALTER TABLE `service_orders` DROP COLUMN `device_model`;--> statement-breakpoint
ALTER TABLE `service_orders` DROP COLUMN `imei`;