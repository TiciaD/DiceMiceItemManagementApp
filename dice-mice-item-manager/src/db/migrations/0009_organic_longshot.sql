CREATE TABLE `class_ability` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`level` integer NOT NULL,
	`class_id` text NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `class_base_attribute` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`level` integer NOT NULL,
	`attack` integer NOT NULL,
	`spell_attack` integer NOT NULL,
	`ac` integer NOT NULL,
	`fortitude` integer NOT NULL,
	`reflex` integer NOT NULL,
	`will` integer NOT NULL,
	`damage_bonus` text NOT NULL,
	`leadership` integer NOT NULL,
	`skill_ranks` integer NOT NULL,
	`slayer` text,
	`rage` text,
	`brutal_advantage` integer,
	FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `class_skill` (
	`class_id` text NOT NULL,
	`skill_id` text NOT NULL,
	PRIMARY KEY(`class_id`, `skill_id`),
	FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skill_id`) REFERENCES `skill`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `class` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`prerequisite_stat_1` text NOT NULL,
	`prerequisite_stat_2` text,
	`is_available` integer DEFAULT true NOT NULL,
	`willpower_progression` text NOT NULL,
	`hit_die` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `skill_ability` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`level` integer NOT NULL,
	`skill_id` text NOT NULL,
	FOREIGN KEY (`skill_id`) REFERENCES `skill`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `skill` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`associated_stat` text NOT NULL
);
