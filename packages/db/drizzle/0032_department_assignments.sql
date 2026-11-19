CREATE TABLE `department_members` (
	`department_id` varchar(25) NOT NULL,
	`employee_id` varchar(25) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `department_members_department_id_employee_id_pk` PRIMARY KEY(`department_id`,`employee_id`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` varchar(25) NOT NULL,
	`company_id` varchar(25) NOT NULL,
	`name` varchar(80) NOT NULL,
	`leader_id` varchar(25),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `departments_company_name_unique` UNIQUE(`company_id`,`name`)
);
--> statement-breakpoint
CREATE TABLE `service_order_assignments` (
	`id` varchar(25) NOT NULL,
	`service_order_id` varchar(25) NOT NULL,
	`from_department_id` varchar(25),
	`to_department_id` varchar(25),
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
	`department_id` varchar(25) NOT NULL,
	`assignee_mode` enum('pool','leader','employee') NOT NULL DEFAULT 'pool',
	`employee_id` varchar(25),
	CONSTRAINT `service_order_stage_owners_id` PRIMARY KEY(`id`),
	CONSTRAINT `service_order_stage_owners_company_status_unique` UNIQUE(`company_id`,`status`)
);
--> statement-breakpoint
ALTER TABLE `service_orders` ADD `department_id` varchar(25);--> statement-breakpoint
ALTER TABLE `service_orders` ADD `assignee_id` varchar(25);--> statement-breakpoint
ALTER TABLE `department_members` ADD CONSTRAINT `department_members_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `department_members` ADD CONSTRAINT `department_members_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `departments` ADD CONSTRAINT `departments_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `departments` ADD CONSTRAINT `departments_leader_id_employees_id_fk` FOREIGN KEY (`leader_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_assignments` ADD CONSTRAINT `service_order_assignments_service_order_id_service_orders_id_fk` FOREIGN KEY (`service_order_id`) REFERENCES `service_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_assignments` ADD CONSTRAINT `service_order_assignments_from_department_id_departments_id_fk` FOREIGN KEY (`from_department_id`) REFERENCES `departments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_assignments` ADD CONSTRAINT `service_order_assignments_to_department_id_departments_id_fk` FOREIGN KEY (`to_department_id`) REFERENCES `departments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_assignments` ADD CONSTRAINT `service_order_assignments_from_assignee_id_employees_id_fk` FOREIGN KEY (`from_assignee_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_assignments` ADD CONSTRAINT `service_order_assignments_to_assignee_id_employees_id_fk` FOREIGN KEY (`to_assignee_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_assignments` ADD CONSTRAINT `service_order_assignments_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_stage_owners` ADD CONSTRAINT `service_order_stage_owners_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_stage_owners` ADD CONSTRAINT `service_order_stage_owners_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_stage_owners` ADD CONSTRAINT `service_order_stage_owners_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `department_members_employee_idx` ON `department_members` (`employee_id`);--> statement-breakpoint
CREATE INDEX `service_order_assignments_order_idx` ON `service_order_assignments` (`service_order_id`);--> statement-breakpoint
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_assignee_id_employees_id_fk` FOREIGN KEY (`assignee_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `service_orders_department_idx` ON `service_orders` (`department_id`);--> statement-breakpoint
CREATE INDEX `service_orders_assignee_idx` ON `service_orders` (`assignee_id`);