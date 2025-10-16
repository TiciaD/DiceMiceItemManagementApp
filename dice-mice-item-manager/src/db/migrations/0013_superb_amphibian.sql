CREATE TABLE `character_skills` (
	`character_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`points_invested` integer DEFAULT 0 NOT NULL,
	`last_updated` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`character_id`, `skill_id`),
	FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skill_id`) REFERENCES `skill`(`id`) ON UPDATE no action ON DELETE cascade
);
