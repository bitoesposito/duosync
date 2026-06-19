CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`category` text NOT NULL,
	`description` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `appointments_user_date_idx` ON `appointments` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `recurring_appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`category` text NOT NULL,
	`description` text,
	`repeat_days` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recurring_user_idx` ON `recurring_appointments` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL
);
