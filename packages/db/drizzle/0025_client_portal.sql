CREATE TABLE `portal_links` (
	`id` varchar(25) NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`cpf` varchar(11) NOT NULL,
	`email` varchar(255) NOT NULL,
	`company_id` varchar(25),
	`client_id` varchar(25),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`last_used_at` timestamp,
	`revoked_at` timestamp,
	CONSTRAINT `portal_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_links_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `portal_sessions` (
	`id` varchar(25) NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`portal_link_id` varchar(25),
	`cpf` varchar(11) NOT NULL,
	`email` varchar(255) NOT NULL,
	`client_id` varchar(25),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `portal_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_sessions_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
ALTER TABLE `portal_links` ADD CONSTRAINT `portal_links_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portal_links` ADD CONSTRAINT `portal_links_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portal_sessions` ADD CONSTRAINT `portal_sessions_portal_link_id_portal_links_id_fk` FOREIGN KEY (`portal_link_id`) REFERENCES `portal_links`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portal_sessions` ADD CONSTRAINT `portal_sessions_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `portal_links_client_idx` ON `portal_links` (`client_id`);