import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { successResponse } from '../utils/response';

const REFRESH_TOKEN_COOKIE = 'refreshToken';
const IS_PROD = process.env.NODE_ENV === 'production';

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'strict',
  });
};

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body;
      const { user, accessToken, refreshToken } = await authService.register({ name, email, password });
      
      setRefreshCookie(res, refreshToken);
      res.status(201).json(successResponse({ user, accessToken }, 'Registration successful'));
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await authService.login({ email, password });
      
      setRefreshCookie(res, refreshToken);
      res.status(200).json(successResponse({ user, accessToken }, 'Login successful'));
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const currentToken = req.cookies[REFRESH_TOKEN_COOKIE];
      if (!currentToken) {
        res.status(401).json({ success: false, message: 'No refresh token provided' });
        return;
      }

      const { accessToken, refreshToken } = await authService.refresh(currentToken);
      
      setRefreshCookie(res, refreshToken);
      res.status(200).json(successResponse({ accessToken }, 'Token refreshed'));
    } catch (error) {
      clearRefreshCookie(res);
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const currentToken = req.cookies[REFRESH_TOKEN_COOKIE];
      if (currentToken) {
        await authService.logout(currentToken);
      }
      clearRefreshCookie(res);
      res.status(200).json(successResponse(null, 'Logged out successfully'));
    } catch (error) {
      next(error);
    }
  },

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getUserById(req.user!.id);
      res.status(200).json(successResponse(user, 'Profile fetched'));
    } catch (error) {
      next(error);
    }
  },
};
