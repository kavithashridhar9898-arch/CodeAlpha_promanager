import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validateMiddleware';
import { validateRegistration, validatePasswordPolicy } from '../middleware/validationMiddleware';

const authRouter = Router();

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login requests per windowMs
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 register requests per windowMs
  message: { success: false, message: 'Too many accounts created from this IP, please try again after an hour' },
});

// Validation Schemas

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// Routes
authRouter.post('/register', registerLimiter, validateRegistration, validatePasswordPolicy, authController.register);
authRouter.post('/login', loginLimiter, validate(loginSchema), authController.login);
authRouter.post('/demo/login', loginLimiter, authController.demoLogin);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.getMe);
authRouter.patch('/me', authenticate, authController.updateMe);
authRouter.get('/users/:userId', authenticate, authController.getUserById);

// Fallback for misconfigured GitHub OAuth Callback URL
authRouter.get('/github/callback', (req, res) => {
  const { code, state } = req.query;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3001';
  res.redirect(`${clientUrl}/dashboard/integrations/github/callback?code=${code}&state=${state}`);
});

export { authRouter };
