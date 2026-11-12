ALTER TABLE `estimates` ADD `public_token_hash` varchar(64);--> statement-breakpoint
ALTER TABLE `estimates` ADD `sent_to` varchar(255);--> statement-breakpoint
ALTER TABLE `estimates` ADD `sent_at` timestamp;--> statement-breakpoint
ALTER TABLE `estimates` ADD `responded_at` timestamp;--> statement-breakpoint
ALTER TABLE `estimates` ADD `rejection_reason` text;--> statement-breakpoint
ALTER TABLE `estimates` ADD CONSTRAINT `estimates_public_token_hash_unique` UNIQUE(`public_token_hash`);