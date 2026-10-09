CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`host_hash` text NOT NULL,
	`invite_hash` text NOT NULL,
	`host_name` text NOT NULL,
	`guest_hash` text,
	`guest_name` text,
	`state` text DEFAULT 'waiting' NOT NULL,
	`expires` integer NOT NULL,
	`heartbeat` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `signals` (
	`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_id` text NOT NULL,
	`sender` text NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_signals_room_seq` ON `signals` (`room_id`,`seq`);