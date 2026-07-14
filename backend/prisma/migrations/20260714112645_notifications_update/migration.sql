/*
  Warnings:

  - You are about to drop the column `readAt` on the `notifications` table. All the data in the column will be lost.
  - Added the required column `title` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `notifications` DROP COLUMN `readAt`,
    ADD COLUMN `isRead` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `referenceType` VARCHAR(191) NULL,
    ADD COLUMN `title` VARCHAR(191) NOT NULL,
    MODIFY `type` ENUM('TASK_ASSIGNED', 'TASK_UNASSIGNED', 'TASK_COMMENT', 'TASK_STATUS_CHANGED', 'TASK_DUE_DATE_CHANGED', 'COMMENT_MENTION', 'SYSTEM_ALERT', 'PROJECT_INVITE', 'PROJECT_ADDED', 'PROJECT_REMOVED', 'PROJECT_ARCHIVED', 'PROJECT_RESTORED') NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `notificationSettings` JSON NULL;
