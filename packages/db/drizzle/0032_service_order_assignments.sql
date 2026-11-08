CREATE TABLE `sectors` (
	`id` varchar(25) NOT NULL,
	`company_id` varchar(25) NOT NULL,
	`name` varchar(80) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sectors_id` PRIMARY KEY(`id`),
	CONSTRAINT `sectors_company_name_unique` UNIQUE(`company_id`,`name`)
);
--> statement-breakpoint
CREATE TABLE `service_order_assignments` (
	`id` varchar(25) NOT NULL,
	`service_order_id` varchar(25) NOT NULL,
	`from_sector_id` varchar(25),
	`to_sector_id` varchar(25),
	`from_assignee_id` varchar(25),
	`to_assignee_id` varchar(25),
	`employee_id` varchar(25),
	`created_at` timestamp(3) NOT NULL DEFAULT now(3),
	CONSTRAINT `service_order_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_order_stage_owners` (
	`id` varchar(25) NOT NULL,
	`company_id` varchar(25) NOT NULL,
	`status` enum('pending','diagnosing','waiting_approval','approved','fixing','ready','delivered') NOT NULL,
	`sector_id` varchar(25),
	`employee_id` varchar(25),
	CONSTRAINT `service_order_stage_owners_id` PRIMARY KEY(`id`),
	CONSTRAINT `service_order_stage_owners_company_status_unique` UNIQUE(`company_id`,`status`)
);
--> statement-breakpoint
ALTER TABLE `employees` ADD `sector_id` varchar(25);--> statement-breakpoint
ALTER TABLE `service_orders` ADD `sector_id` varchar(25);--> statement-breakpoint
ALTER TABLE `service_orders` ADD `assignee_id` varchar(25);--> statement-breakpoint
ALTER TABLE `sectors` ADD CONSTRAINT `sectors_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_assignments` ADD CONSTRAINT `service_order_assignments_service_order_id_service_orders_id_fk` FOREIGN KEY (`service_order_id`) REFERENCES `service_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_assignments` ADD CONSTRAINT `service_order_assignments_from_sector_id_sectors_id_fk` FOREIGN KEY (`from_sector_id`) REFERENCES `sectors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_assignments` ADD CONSTRAINT `service_order_assignments_to_sector_id_sectors_id_fk` FOREIGN KEY (`to_sector_id`) REFERENCES `sectors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_assignments` ADD CONSTRAINT `service_order_assignments_from_assignee_id_employees_id_fk` FOREIGN KEY (`from_assignee_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_assignments` ADD CONSTRAINT `service_order_assignments_to_assignee_id_employees_id_fk` FOREIGN KEY (`to_assignee_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_assignments` ADD CONSTRAINT `service_order_assignments_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_stage_owners` ADD CONSTRAINT `service_order_stage_owners_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_stage_owners` ADD CONSTRAINT `service_order_stage_owners_sector_id_sectors_id_fk` FOREIGN KEY (`sector_id`) REFERENCES `sectors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_stage_owners` ADD CONSTRAINT `service_order_stage_owners_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `service_order_assignments_order_idx` ON `service_order_assignments` (`service_order_id`);--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_sector_id_sectors_id_fk` FOREIGN KEY (`sector_id`) REFERENCES `sectors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_sector_id_sectors_id_fk` FOREIGN KEY (`sector_id`) REFERENCES `sectors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_assignee_id_employees_id_fk` FOREIGN KEY (`assignee_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `service_orders_sector_idx` ON `service_orders` (`sector_id`);--> statement-breakpoint
CREATE INDEX `service_orders_assignee_idx` ON `service_orders` (`assignee_id`);