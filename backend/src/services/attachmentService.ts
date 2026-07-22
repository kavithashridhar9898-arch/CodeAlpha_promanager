import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import * as fs from 'fs';
import * as path from 'path';

export const attachmentService = {
  async uploadAttachment(taskId: string, file: Express.Multer.File) {
    const url = `/uploads/attachments/${file.filename}`;
    
    return prisma.fileAttachment.create({
      data: {
        taskId,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
      },
    });
  },

  async getTaskAttachments(taskId: string) {
    return prisma.fileAttachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async deleteAttachment(id: string) {
    const attachment = await prisma.fileAttachment.findUnique({ where: { id } });
    if (!attachment) throw new AppError('Attachment not found', 404);

    const filePath = path.join(__dirname, '../../public/uploads/attachments', attachment.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return prisma.fileAttachment.delete({ where: { id } });
  },
};
