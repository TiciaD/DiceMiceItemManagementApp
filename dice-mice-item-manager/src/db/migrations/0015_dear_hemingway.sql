CREATE TABLE `user_weapons` (
	`weapon_id` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `weapon_id`),
	FOREIGN KEY (`weapon_id`) REFERENCES `weapons`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `weapon_damage_types` (
	`weapon_id` text NOT NULL,
	`damage_type_code` text NOT NULL,
	`stat_threshold` integer,
	`display_order` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`weapon_id`, `damage_type_code`),
	FOREIGN KEY (`weapon_id`) REFERENCES `weapons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `weapon_template_damage_types` (
	`weapon_template_id` text NOT NULL,
	`damage_type_code` text NOT NULL,
	`suggested_stat_threshold` integer,
	`display_order` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`weapon_template_id`, `damage_type_code`),
	FOREIGN KEY (`weapon_template_id`) REFERENCES `weapon_templates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `weapon_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`handedness` text NOT NULL,
	`damage_mode` text NOT NULL,
	`mode_code` text DEFAULT 'none' NOT NULL,
	`description` text,
	`props_json` text
);
--> statement-breakpoint
CREATE TABLE `weapons` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`weapon_template_id` text,
	`handedness` text NOT NULL,
	`damage_mode` text NOT NULL,
	`mode_code` text DEFAULT 'none' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer,
	`props_json` text,
	FOREIGN KEY (`weapon_template_id`) REFERENCES `weapon_templates`(`id`) ON UPDATE no action ON DELETE set null
);
