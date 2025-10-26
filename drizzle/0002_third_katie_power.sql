CREATE TABLE `technicians` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`partnerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`username` varchar(100) NOT NULL,
	`passwordHash` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `technicians_id` PRIMARY KEY(`id`),
	CONSTRAINT `technicians_username_unique` UNIQUE(`username`)
);
