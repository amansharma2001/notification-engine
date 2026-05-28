import { Router, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

export function createAuthRouter(secret: string): Router {
  const router = Router();
  router.post('/token', (req: Request, res: Response) => {
    const userId = req.body.userId || 'user-001';
    const token = jwt.sign({ userId }, secret, { expiresIn: '24h' });
    res.json({ token, userId, expiresIn: '24h' });
  });
  return router;
}