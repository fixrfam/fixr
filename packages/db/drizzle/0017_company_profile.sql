ALTER TABLE `uploads` MODIFY COLUMN `upload_purpose` enum('avatar','service_order','model_image','company_logo') NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` ADD `email` varchar(255);--> statement-breakpoint
ALTER TABLE `companies` ADD `phone` varchar(11);--> statement-breakpoint
ALTER TABLE `companies` ADD `website` varchar(255);--> statement-breakpoint
ALTER TABLE `companies` ADD `logo_url` varchar(500);