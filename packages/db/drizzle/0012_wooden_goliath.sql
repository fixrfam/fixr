ALTER TABLE `uploads` RENAME COLUMN `purpose` TO `upload_purpose`;--> statement-breakpoint
DROP INDEX `models_fulltext_idx` ON `models`;--> statement-breakpoint
ALTER TABLE `model_images` MODIFY COLUMN `upload_id` varchar(25) NOT NULL;--> statement-breakpoint
ALTER TABLE `uploads` MODIFY COLUMN `upload_purpose` enum('avatar','service_order','model_image') NOT NULL;