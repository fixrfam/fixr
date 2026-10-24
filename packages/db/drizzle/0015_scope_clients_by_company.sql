ALTER TABLE `clients` DROP INDEX `clients_cpf_unique`;--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `user_id` varchar(25);--> statement-breakpoint
ALTER TABLE `clients` ADD `company_id` varchar(25);--> statement-breakpoint
ALTER TABLE `clients` ADD `email` varchar(255);--> statement-breakpoint
ALTER TABLE `clients` ADD `alternative_phone` varchar(11);--> statement-breakpoint
ALTER TABLE `clients` ADD `address` varchar(255);--> statement-breakpoint
ALTER TABLE `clients` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `clients` ADD `state` varchar(2);--> statement-breakpoint
ALTER TABLE `clients` ADD `updated_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_cpf_company_unique` UNIQUE(`company_id`,`cpf`);--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;