CREATE TABLE `expense_history` (
	`id` integer PRIMARY KEY NOT NULL,
	`series_id` integer,
	`name` text NOT NULL,
	`provider` text,
	`type` text,
	`payment_method` text,
	`amount_cents` integer NOT NULL,
	`expense_date` text NOT NULL,
	`actual_date` text,
	`status` text DEFAULT 'pending',
	`note` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`series_id`) REFERENCES `expense_series`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_history_series_expenseDate` ON `expense_history` (`series_id`,`expense_date`);--> statement-breakpoint
CREATE INDEX `ix_history_status_expenseDate` ON `expense_history` (`status`,`expense_date`);--> statement-breakpoint
CREATE INDEX `ix_history_series_status` ON `expense_history` (`series_id`,`status`);--> statement-breakpoint
CREATE TABLE `expense_series` (
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
CREATE INDEX `ix_series_status` ON `expense_series` (`status`);--> statement-breakpoint
CREATE INDEX `ix_series_nextDate` ON `expense_series` (`next_date`);