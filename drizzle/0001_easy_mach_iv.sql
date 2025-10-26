CREATE TABLE `apiConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configKey` varchar(100) NOT NULL,
	`configValue` text NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apiConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `apiConfig_configKey_unique` UNIQUE(`configKey`)
);
--> statement-breakpoint
CREATE TABLE `installations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceAppointmentId` varchar(255) NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerCF` varchar(50),
	`customerPhone` varchar(50),
	`customerEmail` varchar(320),
	`customerAddress` text,
	`installationAddress` text NOT NULL,
	`technicalNotes` text,
	`imagesToView` text,
	`completionLink` text,
	`durationMinutes` int,
	`travelTimeMinutes` int,
	`status` enum('pending','scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`teamId` int,
	`partnerId` int,
	`scheduledStart` datetime,
	`scheduledEnd` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `installations_id` PRIMARY KEY(`id`),
	CONSTRAINT `installations_serviceAppointmentId_unique` UNIQUE(`serviceAppointmentId`)
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`salesforcePartnerId` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`startingAddress` text,
	`username` varchar(100) NOT NULL,
	`passwordHash` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partners_id` PRIMARY KEY(`id`),
	CONSTRAINT `partners_salesforcePartnerId_unique` UNIQUE(`salesforcePartnerId`),
	CONSTRAINT `partners_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`salesforceTeamId` varchar(255) NOT NULL,
	`partnerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`),
	CONSTRAINT `teams_salesforceTeamId_unique` UNIQUE(`salesforceTeamId`)
);
