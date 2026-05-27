CREATE TABLE `categories` (
	`id` varchar(25) NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `makers` (
	`id` varchar(25) NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`url` varchar(255) NOT NULL,
	`device_count` int NOT NULL DEFAULT 0,
	`page_count` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `makers_id` PRIMARY KEY(`id`),
	CONSTRAINT `makers_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `model_images` (
	`id` varchar(25) NOT NULL,
	`model_id` varchar(25) NOT NULL,
	`original_url` varchar(255),
	`r2_key` varchar(255),
	`is_primary` boolean NOT NULL DEFAULT false,
	`variant` varchar(50),
	`position` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `model_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `models` (
	`id` varchar(25) NOT NULL,
	`maker_id` varchar(25) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`url` varchar(255) NOT NULL,
	`image_url` varchar(255),
	`image_local_path` varchar(255),
	`category_id` varchar(25),
	`announced` varchar(100),
	`status` varchar(100),
	`dimensions` varchar(255),
	`weight` varchar(100),
	`build` varchar(255),
	`sim` varchar(100),
	`display_type` varchar(255),
	`display_size` varchar(100),
	`display_resolution` varchar(100),
	`display_protection` varchar(100),
	`os` varchar(255),
	`chipset` varchar(255),
	`cpu` varchar(255),
	`gpu` varchar(255),
	`card_slot` varchar(255),
	`internal_memory` varchar(255),
	`main_camera` varchar(255),
	`main_camera_features` text,
	`main_camera_video` varchar(255),
	`selfie_camera` varchar(255),
	`selfie_features` text,
	`selfie_video` varchar(255),
	`battery` varchar(255),
	`battery_charging` varchar(255),
	`network_tech` varchar(255),
	`sensors` varchar(255),
	`colors` varchar(255),
	`colors_hex` text,
	`models_text` varchar(255),
	`price` varchar(100),
	`dimensions_width` float,
	`dimensions_height` float,
	`dimensions_thickness` float,
	`weight_grams` float,
	`display_size_inches` float,
	`display_size_ratio` varchar(100),
	`display_res_width` int,
	`display_res_height` int,
	`display_res_ppi` int,
	`released` varchar(100),
	`meta` text,
	`company_id` varchar(25),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `models_id` PRIMARY KEY(`id`),
	CONSTRAINT `slug_company_unique` UNIQUE(`slug`,`company_id`)
);
--> statement-breakpoint
ALTER TABLE `employees` MODIFY COLUMN `roles` enum('guest','technician','warehouse','financial','manager','admin') NOT NULL;--> statement-breakpoint
ALTER TABLE `model_images` ADD CONSTRAINT `model_images_model_id_models_id_fk` FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `models` ADD CONSTRAINT `models_maker_id_makers_id_fk` FOREIGN KEY (`maker_id`) REFERENCES `makers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `models` ADD CONSTRAINT `models_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `models` ADD CONSTRAINT `models_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;