CREATE TABLE `short_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(16) NOT NULL,
	`targetUrl` varchar(2048) NOT NULL,
	`agreementId` int,
	`clicks` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `short_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `short_links_slug_unique` UNIQUE(`slug`)
);
