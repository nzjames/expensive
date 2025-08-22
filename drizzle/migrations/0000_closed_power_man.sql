CREATE TABLE `expense_instances` (
	`id` integer PRIMARY KEY NOT NULL,
	`template_id` integer,
	`expected_date` text NOT NULL,
	`actual_date` text,
	`amount_cents` integer,
	`status` text DEFAULT 'pending',
	`note` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`template_id`) REFERENCES `expense_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_instances_template_expectedDate` ON `expense_instances` (`template_id`,`expected_date`);--> statement-breakpoint
CREATE INDEX `ix_instances_status_expectedDate` ON `expense_instances` (`status`,`expected_date`);--> statement-breakpoint
CREATE INDEX `ix_instances_template_status` ON `expense_instances` (`template_id`,`status`);--> statement-breakpoint
CREATE TABLE `expense_templates` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`provider` text,
	`type` text,
	`status` text DEFAULT 'active' NOT NULL,
	`frequency_interval` integer NOT NULL,
	`frequency_unit` text NOT NULL,
	`payment_method` text,
	`amount_cents` integer NOT NULL,
	`contact_email` text,
	`portal_url` text,
	`next_date` text,
	`renewal_date` text,
	`verified_date` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `ix_templates_status` ON `expense_templates` (`status`);--> statement-breakpoint
CREATE INDEX `ix_templates_nextDate` ON `expense_templates` (`next_date`);