CREATE TABLE `model_categories` (
	`id` varchar(25) NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	CONSTRAINT `model_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `model_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `model_makers` (
	`id` varchar(25) NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`url` varchar(255) NOT NULL,
	`device_count` int NOT NULL DEFAULT 0,
	`page_count` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `model_makers_id` PRIMARY KEY(`id`),
	CONSTRAINT `model_makers_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `service_order_images` (
	`id` varchar(25) NOT NULL,
	`service_order_id` varchar(25) NOT NULL,
	`employee_id` varchar(25) NOT NULL,
	`upload_id` varchar(25) NOT NULL,
	`image_url` varchar(255) NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`size_in_bytes` int NOT NULL,
	`content_type` varchar(50) NOT NULL,
	`description` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `service_order_images_id` PRIMARY KEY(`id`)
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
CREATE TABLE `uploads` (
	`id` varchar(25) NOT NULL,
	`company_id` varchar(25) NOT NULL,
	`employee_id` varchar(25) NOT NULL,
	`key` varchar(512) NOT NULL,
	`url` varchar(512) NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`content_type` varchar(50) NOT NULL,
	`size_in_bytes` int NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `uploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `employees` MODIFY COLUMN `roles` enum('guest','technician','warehouse','financial','manager','admin') NOT NULL;--> statement-breakpoint
ALTER TABLE `service_order_images` ADD CONSTRAINT `service_order_images_service_order_id_service_orders_id_fk` FOREIGN KEY (`service_order_id`) REFERENCES `service_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_images` ADD CONSTRAINT `service_order_images_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_images` ADD CONSTRAINT `service_order_images_upload_id_uploads_id_fk` FOREIGN KEY (`upload_id`) REFERENCES `uploads`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_device_brand_id_model_makers_id_fk` FOREIGN KEY (`device_brand_id`) REFERENCES `model_makers`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_device_category_id_model_categories_id_fk` FOREIGN KEY (`device_category_id`) REFERENCES `model_categories`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `uploads` ADD CONSTRAINT `uploads_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `uploads` ADD CONSTRAINT `uploads_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE restrict ON UPDATE no action;