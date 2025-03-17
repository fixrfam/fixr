CREATE TABLE `users` (
	`id` varchar(25) NOT NULL,
	`email` varchar(255) NOT NULL,
	`display_name` varchar(100),
	`password_hash` varchar(128) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`verified` boolean NOT NULL DEFAULT false,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` varchar(25) NOT NULL,
	`token` varchar(128) NOT NULL,
	`user_id` varchar(25) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `refresh_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `one_time_tokens` (
	`id` varchar(25) NOT NULL,
	`token` varchar(128) NOT NULL,
	`ott_type` enum('confirmation','password_reset','account_deletion') NOT NULL,
	`relates_to` varchar(255),
	`user_id` varchar(25),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `one_time_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `one_time_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` varchar(25) NOT NULL,
	`name` varchar(100) NOT NULL,
	`cnpj` varchar(14) NOT NULL,
	`address` varchar(255),
	`subdomain` varchar(32) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_cnpj_unique` UNIQUE(`cnpj`),
	CONSTRAINT `organizations_subdomain_unique` UNIQUE(`subdomain`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` varchar(25) NOT NULL,
	`name` varchar(100) NOT NULL,
	`cpf` varchar(11) NOT NULL,
	`phone` varchar(11),
	`roles` enum('admin','manager','employee') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`user_id` varchar(25) NOT NULL,
	`organization_id` varchar(25) NOT NULL,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_cpf_unique` UNIQUE(`cpf`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` varchar(25) NOT NULL,
	`name` varchar(100) NOT NULL,
	`cpf` varchar(11) NOT NULL,
	`phone` varchar(11),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`user_id` varchar(25) NOT NULL,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `clients_cpf_unique` UNIQUE(`cpf`)
);
--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `one_time_tokens` ADD CONSTRAINT `one_time_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;