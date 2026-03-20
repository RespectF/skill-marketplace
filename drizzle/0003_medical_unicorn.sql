CREATE TABLE `skill_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`skillId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skill_favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skill_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`skillId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skill_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_skill_api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`skillId` int NOT NULL,
	`apiKey` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_skill_api_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `skills` ADD `likeCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `skills` ADD `favoriteCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `skills` ADD `requiresApiKey` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `skills` ADD `apiKeyLabel` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;