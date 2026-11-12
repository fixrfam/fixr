CREATE TABLE `service_order_items` (
	`id` varchar(25) NOT NULL,
	`service_order_id` varchar(25) NOT NULL,
	`item_type` enum('part','service') NOT NULL,
	`part_id` varchar(25),
	`service_id` varchar(25),
	`name` varchar(120) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unit_price` decimal(10, 2) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `service_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `service_order_items` ADD CONSTRAINT `service_order_items_service_order_id_service_orders_id_fk` FOREIGN KEY (`service_order_id`) REFERENCES `service_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_items` ADD CONSTRAINT `service_order_items_part_id_parts_id_fk` FOREIGN KEY (`part_id`) REFERENCES `parts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_order_items` ADD CONSTRAINT `service_order_items_service_id_services_id_fk` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE set null ON UPDATE no action;