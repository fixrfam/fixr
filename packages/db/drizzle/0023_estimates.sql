CREATE TABLE `estimate_items` (
	`id` varchar(25) NOT NULL,
	`estimate_id` varchar(25) NOT NULL,
	`item_type` enum('part','service') NOT NULL,
	`part_id` varchar(25),
	`service_id` varchar(25),
	`name` varchar(120) NOT NULL,
	`quantity` int NOT NULL,
	`unit_price` decimal(10, 2) NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `estimate_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estimates` (
	`id` varchar(25) NOT NULL,
	`company_id` varchar(25) NOT NULL,
	`service_order_id` varchar(25) NOT NULL,
	`client_id` varchar(25),
	`created_by` varchar(25),
	`number` int NOT NULL,
	`estimate_status` enum('draft','sent','approved','rejected') NOT NULL DEFAULT 'draft',
	`discount_percentage` decimal(5, 2) NOT NULL DEFAULT 0,
	`valid_until` timestamp NOT NULL,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `estimates_id` PRIMARY KEY(`id`),
	CONSTRAINT `estimates_number_company_unique` UNIQUE(`company_id`,`number`)
);
--> statement-breakpoint
ALTER TABLE `estimate_items` ADD CONSTRAINT `estimate_items_estimate_id_estimates_id_fk` FOREIGN KEY (`estimate_id`) REFERENCES `estimates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `estimate_items` ADD CONSTRAINT `estimate_items_part_id_parts_id_fk` FOREIGN KEY (`part_id`) REFERENCES `parts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `estimate_items` ADD CONSTRAINT `estimate_items_service_id_services_id_fk` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `estimates` ADD CONSTRAINT `estimates_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `estimates` ADD CONSTRAINT `estimates_service_order_id_service_orders_id_fk` FOREIGN KEY (`service_order_id`) REFERENCES `service_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `estimates` ADD CONSTRAINT `estimates_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `estimates` ADD CONSTRAINT `estimates_created_by_employees_id_fk` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;