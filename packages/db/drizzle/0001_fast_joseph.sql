RENAME TABLE `organizations` TO `companies`;--> statement-breakpoint
ALTER TABLE `employees` RENAME COLUMN `organization_id` TO `company_id`;--> statement-breakpoint
ALTER TABLE `companies` DROP INDEX `organizations_cnpj_unique`;--> statement-breakpoint
ALTER TABLE `companies` DROP INDEX `organizations_subdomain_unique`;--> statement-breakpoint
ALTER TABLE `employees` DROP FOREIGN KEY `employees_organization_id_organizations_id_fk`;
--> statement-breakpoint
ALTER TABLE `companies` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `companies` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `companies` ADD CONSTRAINT `companies_cnpj_unique` UNIQUE(`cnpj`);--> statement-breakpoint
ALTER TABLE `companies` ADD CONSTRAINT `companies_subdomain_unique` UNIQUE(`subdomain`);--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;