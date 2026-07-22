import { Request, Response, NextFunction } from 'express';

export const validatePasswordPolicy = (req: Request, res: Response, next: NextFunction) => {
  const { password } = req.body;
  if (!password) {
    res.status(400).json({ status: 'error', message: 'Password is required' });
    return;
  }
  
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
  if (!strongPasswordRegex.test(password)) {
    res.status(400).json({ 
      status: 'error', 
      message: 'Password must be at least 8 characters long, contain 1 uppercase, 1 lowercase, and 1 number.' 
    });
    return;
  }
  
  next();
};

export const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
  const { email, name } = req.body;
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    res.status(400).json({ status: 'error', message: 'Valid email is required' });
    return;
  }
  if (!name || name.length < 2) {
    res.status(400).json({ status: 'error', message: 'Name must be at least 2 characters long' });
    return;
  }
  
  next();
};
