-- AlterTable
ALTER TABLE `comments` ADD COLUMN `mentionedUserIds` JSON NULL,
    ADD COLUMN `parentCommentId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `comments_parentCommentId_idx` ON `comments`(`parentCommentId`);

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_parentCommentId_fkey` FOREIGN KEY (`parentCommentId`) REFERENCES `comments`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
