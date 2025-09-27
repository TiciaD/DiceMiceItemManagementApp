CREATE TABLE `potion_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
  `level` integer NOT NULL,
	`school` text NOT NULL,
	`rarity` text NOT NULL,
	`potency_fail_effect` text NOT NULL,
	`potency_success_effect` text NOT NULL,
	`potency_critical_success_effect` text NOT NULL,
	`description` text,
	`cost` integer NOT NULL,
	`split_amount` text,
	`special_ingredient` text,
	`props_json` text
);
--> statement-breakpoint
CREATE TABLE `potions` (
	`id` text PRIMARY KEY NOT NULL,
	`custom_id` text NOT NULL,
	`potion_template_id` text NOT NULL,
	`crafted_potency` text NOT NULL,
	`consumed_by` text,
	`consumed_at` integer,
	`crafted_by` text NOT NULL,
	`crafted_at` integer,
	`weight` real NOT NULL,
	FOREIGN KEY (`potion_template_id`) REFERENCES `potion_templates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_potions` (
	`potion_id` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `potion_id`),
	FOREIGN KEY (`potion_id`) REFERENCES `potions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
