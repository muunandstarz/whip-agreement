CREATE TABLE `chargeover_customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`coCustomerId` int NOT NULL,
	`externalKey` varchar(128),
	`email` varchar(320),
	`name` varchar(255),
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chargeover_customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `chargeover_customers_memberId_unique` UNIQUE(`memberId`),
	CONSTRAINT `chargeover_customers_coCustomerId_unique` UNIQUE(`coCustomerId`)
);
--> statement-breakpoint
CREATE TABLE `chargeover_invoice_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`memberId` int NOT NULL,
	`coLineId` int,
	`description` varchar(512) NOT NULL,
	`lineType` enum('weekly_fee','ticket','toll','late_fee','deposit','credit','other') NOT NULL DEFAULT 'other',
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` int NOT NULL DEFAULT 0,
	`lineTotal` int NOT NULL DEFAULT 0,
	`lineDate` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chargeover_invoice_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chargeover_invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`coCustomerId` int NOT NULL,
	`coInvoiceId` int NOT NULL,
	`invoiceNumber` varchar(64),
	`status` enum('draft','open','past_due','paid','void','written_off') NOT NULL DEFAULT 'open',
	`dueDate` varchar(20),
	`invoiceDate` varchar(20),
	`subtotal` int NOT NULL DEFAULT 0,
	`taxTotal` int NOT NULL DEFAULT 0,
	`total` int NOT NULL DEFAULT 0,
	`balance` int NOT NULL DEFAULT 0,
	`pdfUrl` varchar(1024),
	`notes` text,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chargeover_invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `chargeover_invoices_coInvoiceId_unique` UNIQUE(`coInvoiceId`)
);
--> statement-breakpoint
CREATE TABLE `chargeover_webhook_events` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`eventType` varchar(128) NOT NULL,
	`coObjectId` int,
	`coObjectType` varchar(64),
	`payload` json NOT NULL,
	`processed` boolean NOT NULL DEFAULT false,
	`processedAt` timestamp,
	`error` text,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chargeover_webhook_events_id` PRIMARY KEY(`id`)
);
