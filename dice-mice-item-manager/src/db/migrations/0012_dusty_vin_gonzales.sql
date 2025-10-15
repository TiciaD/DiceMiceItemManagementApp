CREATE TABLE `character_potion_mastery` (
	`character_id` text NOT NULL,
	`potion_template_id` text NOT NULL,
	`mastery_level` integer DEFAULT 0 NOT NULL,
	`last_updated` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`character_id`, `potion_template_id`),
	FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`potion_template_id`) REFERENCES `potion_templates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `character_spell_mastery` (
	`character_id` text NOT NULL,
	`spell_template_id` text NOT NULL,
	`mastery_level` integer DEFAULT 0 NOT NULL,
	`last_updated` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`character_id`, `spell_template_id`),
	FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`spell_template_id`) REFERENCES `spell_templates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `character` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user_id` text NOT NULL,
	`house_id` text NOT NULL,
	`county_id` text NOT NULL,
	`class_id` text NOT NULL,
	`current_level` integer DEFAULT 1 NOT NULL,
	`current_HP` integer DEFAULT 0 NOT NULL,
	`max_HP` integer DEFAULT 0 NOT NULL,
	`current_status` text DEFAULT 'ALIVE' NOT NULL,
	`current_STR` integer DEFAULT 0 NOT NULL,
	`current_CON` integer DEFAULT 0 NOT NULL,
	`current_DEX` integer DEFAULT 0 NOT NULL,
	`current_INT` integer DEFAULT 0 NOT NULL,
	`current_WIS` integer DEFAULT 0 NOT NULL,
	`current_CHA` integer DEFAULT 0 NOT NULL,
	`hp_rolls_by_level` text,
	`stats_by_level` text,
	`trait` text,
	`notes` text,
	`experience` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`house_id`) REFERENCES `house`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`county_id`) REFERENCES `county`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON UPDATE no action ON DELETE cascade
);
