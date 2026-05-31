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
	`announced` text,
	`status` text,
	`dimensions` text,
	`weight` text,
	`build` text,
	`sim` text,
	`display_type` text,
	`display_size` text,
	`display_resolution` text,
	`display_protection` text,
	`os` text,
	`chipset` text,
	`cpu` text,
	`gpu` text,
	`card_slot` text,
	`internal_memory` text,
	`main_camera` text,
	`main_camera_features` text,
	`main_camera_video` text,
	`selfie_camera` text,
	`selfie_features` text,
	`selfie_video` text,
	`battery` text,
	`battery_charging` text,
	`network_tech` text,
	`sensors` text,
	`colors` text,
	`colors_hex` text,
	`models_text` text,
	`price` text,
	`dimensions_width` float,
	`dimensions_height` float,
	`dimensions_thickness` float,
	`weight_grams` float,
	`display_size_inches` float,
	`display_size_ratio` text,
	`display_res_width` int,
	`display_res_height` int,
	`display_res_ppi` int,
	`released` text,
	`meta` text,
	`company_id` varchar(25),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `models_id` PRIMARY KEY(`id`),
	CONSTRAINT `slug_company_unique` UNIQUE(`slug`,`company_id`)
);
--> statement-breakpoint
ALTER TABLE `model_categories` DROP INDEX `model_categories_slug_unique`;--> statement-breakpoint
ALTER TABLE `model_makers` DROP INDEX `model_makers_slug_unique`;--> statement-breakpoint
ALTER TABLE `model_images` ADD CONSTRAINT `model_images_model_id_models_id_fk` FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `models` ADD CONSTRAINT `models_maker_id_model_makers_id_fk` FOREIGN KEY (`maker_id`) REFERENCES `model_makers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `models` ADD CONSTRAINT `models_category_id_model_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `model_categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `models` ADD CONSTRAINT `models_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;