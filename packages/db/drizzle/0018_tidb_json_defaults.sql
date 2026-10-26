ALTER TABLE `api_keys` MODIFY COLUMN `scopes` json NOT NULL DEFAULT (json_array());--> statement-breakpoint
ALTER TABLE `services` MODIFY COLUMN `device_categories` json NOT NULL DEFAULT (json_array());--> statement-breakpoint
ALTER TABLE `services` MODIFY COLUMN `test_instructions` json NOT NULL DEFAULT (json_array());--> statement-breakpoint
ALTER TABLE `services` MODIFY COLUMN `test_parameters` json NOT NULL DEFAULT (json_array());