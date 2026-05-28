import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export interface AuthRequest extends Request { userId?: string; }

export function authMiddleware(secret: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) { res.status(401).json({ error: 'Missing token' }); return; }
    try {
      const decoded = jwt.verify(token, secret) as { userId: string };
      req.userId = decoded.userId;
      next();
    } catch { res.status(401).json({ error: 'Invalid token' }); }
  };
}