-- CreateTable
CREATE TABLE `Users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(10) NOT NULL,
    `money` DECIMAL(10, 0) NOT NULL DEFAULT 0,
    `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    `status` ENUM('pending', 'approved') NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Users_username_key`(`username`),
    UNIQUE INDEX `Users_email_key`(`email`),
    UNIQUE INDEX `Users_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LotteryDraws` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `drawDate` DATE NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `status` ENUM('open', 'closed') NOT NULL DEFAULT 'open',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LotteryTickets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticketNumber` CHAR(6) NOT NULL,
    `price` INTEGER NOT NULL,
    `drawId` INTEGER NOT NULL,
    `ownerId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LotteryTickets_ticketNumber_drawId_key`(`ticketNumber`, `drawId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Prizes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prizeRank` INTEGER NOT NULL,
    `prizeDescription` VARCHAR(255) NOT NULL,
    `prizeAmount` DECIMAL(10, 0) NOT NULL,
    `drawId` INTEGER NOT NULL,
    `winningTicketId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Prizes_winningTicketId_key`(`winningTicketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LotteryTickets` ADD CONSTRAINT `LotteryTickets_drawId_fkey` FOREIGN KEY (`drawId`) REFERENCES `LotteryDraws`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LotteryTickets` ADD CONSTRAINT `LotteryTickets_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `Users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prizes` ADD CONSTRAINT `Prizes_drawId_fkey` FOREIGN KEY (`drawId`) REFERENCES `LotteryDraws`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prizes` ADD CONSTRAINT `Prizes_winningTicketId_fkey` FOREIGN KEY (`winningTicketId`) REFERENCES `LotteryTickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
