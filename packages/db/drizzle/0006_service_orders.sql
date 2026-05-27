CREATE TABLE `device_brands` (
	`id` varchar(25) NOT NULL,
	`name` varchar(100) NOT NULL,
	CONSTRAINT `device_brands_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `device_categories` (
	`id` varchar(25) NOT NULL,
	`name` varchar(100) NOT NULL,
	CONSTRAINT `device_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_orders` (
	`id` varchar(25) NOT NULL,
	`company_id` varchar(25) NOT NULL,
	`client_id` varchar(25) NOT NULL,
	`employee_id` varchar(25) NOT NULL,
	`device_brand_id` varchar(25) NOT NULL,
	`device_category_id` varchar(25) NOT NULL,
	`device_model` varchar(100) NOT NULL,
	`imei` varchar(50),
	`reported_defect` text NOT NULL,
	`observations` text,
	`status` enum('pending','diagnosing','waiting_approval','approved','fixing','ready','delivered') NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `service_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_order_photos` (
	`id` varchar(25) NOT NULL,
	`service_order_id` varchar(25) NOT NULL,
	`employee_id` varchar(25) NOT NULL,
	`photo_url` varchar(255) NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`size_in_bytes` int NOT NULL,
	`content_type` varchar(50) NOT NULL,
	`description` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `service_order_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_device_brand_id_device_brands_id_fk` FOREIGN KEY (`device_brand_id`) REFERENCES `device_brands`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_device_category_id_device_categories_id_fk` FOREIGN KEY (`device_category_id`) REFERENCES `device_categories`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_photos` ADD CONSTRAINT `service_order_photos_service_order_id_service_orders_id_fk` FOREIGN KEY (`service_order_id`) REFERENCES `service_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_photos` ADD CONSTRAINT `service_order_photos_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE restrict ON UPDATE no action;
