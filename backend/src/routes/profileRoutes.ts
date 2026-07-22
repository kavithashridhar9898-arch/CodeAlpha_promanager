import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import { profileController } from '../controllers/profileController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validateMiddleware';

const profileRouter = Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user!.id}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and WEBP are allowed.'));
    }
  },
});

// Validation Schema
const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    phone: z.string().optional(),
    jobTitle: z.string().optional(),
    bio: z.string().optional(),
    timezone: z.string().optional(),
    language: z.string().optional(),
    theme: z.string().optional(),
    dateFormat: z.string().optional(),
  }),
});

profileRouter.use(authenticate);

profileRouter.put('/', validate(updateProfileSchema), profileController.update);
profileRouter.post('/avatar', upload.single('avatar'), profileController.updateAvatar);
profileRouter.delete('/avatar', profileController.deleteAvatar);

export { profileRouter };
