ALTER TABLE `potions` ADD `used_amount` text;--> statement-breakpoint
ALTER TABLE `potions` ADD `remaining_amount` text;--> statement-breakpoint
ALTER TABLE `potions` ADD `is_fully_consumed` integer DEFAULT false NOT NULL;