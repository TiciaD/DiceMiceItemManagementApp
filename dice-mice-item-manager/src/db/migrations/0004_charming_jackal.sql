CREATE TABLE `scrolls` (
	`id` text PRIMARY KEY NOT NULL,
	`spell_template_id` text NOT NULL,
	`material` text DEFAULT 'paper' NOT NULL,
	`consumed_by` text,
	`consumed_at` integer,
	`crafted_by` text NOT NULL,
	`crafted_at` integer,
	`weight` real NOT NULL,
	FOREIGN KEY (`spell_template_id`) REFERENCES `spell_templates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `spell_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`school` text NOT NULL,
	`level` integer NOT NULL,
	`base_effect` text NOT NULL,
	`associated_skill` text,
	`inversion_effect` text,
	`mastery_effect` text,
	`is_invertable` integer DEFAULT false NOT NULL,
	`is_discovered` integer DEFAULT false NOT NULL,
	`is_inversion_public` integer DEFAULT false NOT NULL,
	`props_json` text
);
--> statement-breakpoint
CREATE TABLE `user_scrolls` (
	`scroll_id` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `scroll_id`),
	FOREIGN KEY (`scroll_id`) REFERENCES `scrolls`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);