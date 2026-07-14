/*
  Warnings:

  - You are about to drop the column `actorId` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `entityId` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `entityType` on the `activity_logs` table. All the data in the column will be lost.
  - Added the required column `description` to the `activity_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `activity_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `activity_logs` DROP FOREIGN KEY `activity_logs_actorId_fkey`;

-- AlterTable
ALTER TABLE `activity_logs` DROP COLUMN `actorId`,
    DROP COLUMN `entityId`,
    DROP COLUMN `entityType`,
    ADD COLUMN `description` TEXT NOT NULL,
    ADD COLUMN `taskId` VARCHAR(191) NULL,
    ADD COLUMN `userId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `activity_logs_taskId_idx` ON `activity_logs`(`taskId`);

-- CreateIndex
CREATE INDEX `activity_logs_userId_idx` ON `activity_logs`(`userId`);

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
