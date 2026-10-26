CREATE TABLE `devices` (
	`id` varchar(25) NOT NULL,
	`company_id` varchar(25) NOT NULL,
	`client_id` varchar(25) NOT NULL,
	`model_id` varchar(25) NOT NULL,
	`imei` varchar(50),
	`serial_number` varchar(100),
	`notes` text,
	`status` enum('in_shop','ready_for_pickup','with_customer') NOT NULL DEFAULT 'with_customer',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `devices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `service_orders` ADD `device_id` varchar(25);--> statement-breakpoint
ALTER TABLE `devices` ADD CONSTRAINT `devices_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `devices` ADD CONSTRAINT `devices_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `devices` ADD CONSTRAINT `devices_model_id_models_id_fk` FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_device_id_devices_id_fk` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE restrict ON UPDATE no action;