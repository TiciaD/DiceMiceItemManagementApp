ALTER TABLE `county` ADD `associated_skills` text;--> statement-breakpoint
ALTER TABLE `house` ADD `county_id` text DEFAULT 't1i7dfmcoaycjux7fz7njd1n' NOT NULL REFERENCES county(id);