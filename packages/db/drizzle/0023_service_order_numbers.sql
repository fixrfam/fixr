CREATE TABLE `service_order_history` (
	`id` varchar(25) NOT NULL,
	`service_order_id` varchar(25) NOT NULL,
	`from_status` enum('pending','diagnosing','waiting_approval','approved','fixing','ready','delivered'),
	`to_status` enum('pending','diagnosing','waiting_approval','approved','fixing','ready','delivered') NOT NULL,
	`employee_id` varchar(25),
	`note` text,
	`created_at` timestamp(3) NOT NULL DEFAULT now(3),
	CONSTRAINT `service_order_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_order_sequences` (
	`company_id` varchar(25) NOT NULL,
	`last_number` int NOT NULL DEFAULT 0,
	CONSTRAINT `service_order_sequences_company_id` PRIMARY KEY(`company_id`)
);
--> statement-breakpoint
ALTER TABLE `service_orders` ADD `number` int;--> statement-breakpoint
ALTER TABLE `service_order_history` ADD CONSTRAINT `service_order_history_service_order_id_service_orders_id_fk` FOREIGN KEY (`service_order_id`) REFERENCES `service_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_history` ADD CONSTRAINT `service_order_history_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_sequences` ADD CONSTRAINT `service_order_sequences_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `service_order_history_order_idx` ON `service_order_history` (`service_order_id`);