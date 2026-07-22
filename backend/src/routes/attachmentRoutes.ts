import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { attachmentController } from '../controllers/attachmentController';
import { authenticate } from '../middleware/authMiddleware';
import fs from 'fs';

const attachmentRouter = Router({ mergeParams: true });
attachmentRouter.use(authenticate);

const uploadDir = path.join(__dirname, '../../public/uploads/attachments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `attachment-${req.params.taskId}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

attachmentRouter.get('/', attachmentController.getTaskAttachments);
attachmentRouter.post('/', upload.single('file'), attachmentController.uploadAttachment);
attachmentRouter.delete('/:id', attachmentController.deleteAttachment);

export { attachmentRouter };
