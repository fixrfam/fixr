CREATE TABLE `api_keys` (
	`id` varchar(25) NOT NULL,
	`name` varchar(100) NOT NULL,
	`prefix` varchar(16) NOT NULL,
	`key_hash` varchar(255) NOT NULL,
	`employee_id` varchar(25) NOT NULL,
	`company_id` varchar(25) NOT NULL,
	`scopes` json NOT NULL DEFAULT ('[]'),
	`expires_at` timestamp,
	`last_used_at` timestamp,
	`revoked_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_prefix_unique` UNIQUE(`prefix`)
);
--> statement-breakpoint
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;