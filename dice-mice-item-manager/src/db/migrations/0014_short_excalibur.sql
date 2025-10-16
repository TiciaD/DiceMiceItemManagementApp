ALTER TABLE `house` ADD `class_competency_level` integer DEFAULT 7 NOT NULL;--> statement-breakpoint
ALTER TABLE `potions` ADD `crafter_character_id` text REFERENCES character(id);--> statement-breakpoint
ALTER TABLE `potions` ADD `is_grunt_work` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `potions` ADD `supervisor_character_id` text REFERENCES character(id);