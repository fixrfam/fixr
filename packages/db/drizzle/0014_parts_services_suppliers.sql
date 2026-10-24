CREATE TABLE `parts` (
	`id` varchar(25) NOT NULL,
	`company_id` varchar(25) NOT NULL,
	`supplier_id` varchar(25) NOT NULL,
	`sku` varchar(50) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`category` varchar(60) NOT NULL,
	`cost_price` decimal(10, 2) NOT NULL,
	`sale_price` decimal(10, 2) NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`min_stock` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `parts_id` PRIMARY KEY(`id`),
	CONSTRAINT `parts_sku_company_unique` UNIQUE(`company_id`,`sku`)
);
--> statement-breakpoint
CREATE TABLE `service_parts` (
	`service_id` varchar(25) NOT NULL,
	`part_id` varchar(25) NOT NULL,
	CONSTRAINT `service_parts_service_id_part_id_pk` PRIMARY KEY(`service_id`,`part_id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` varchar(25) NOT NULL,
	`company_id` varchar(25) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` varchar(500) NOT NULL,
	`estimated_duration_minutes` int NOT NULL,
	`price` decimal(10, 2) NOT NULL,
	`device_categories` json NOT NULL DEFAULT ('[]'),
	`test_instructions` json NOT NULL DEFAULT ('[]'),
	`test_parameters` json NOT NULL DEFAULT ('[]'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` varchar(25) NOT NULL,
	`company_id` varchar(25) NOT NULL,
	`name` varchar(120) NOT NULL,
	`cnpj` varchar(14) NOT NULL,
	`contact` varchar(120) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`),
	CONSTRAINT `suppliers_cnpj_company_unique` UNIQUE(`company_id`,`cnpj`)
);
--> statement-breakpoint
ALTER TABLE `parts` ADD CONSTRAINT `parts_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parts` ADD CONSTRAINT `parts_supplier_id_suppliers_id_fk` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_parts` ADD CONSTRAINT `service_parts_service_id_services_id_fk` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_parts` ADD CONSTRAINT `service_parts_part_id_parts_id_fk` FOREIGN KEY (`part_id`) REFERENCES `parts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `services` ADD CONSTRAINT `services_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;