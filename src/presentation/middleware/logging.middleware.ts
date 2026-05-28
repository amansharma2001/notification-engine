import { Request, Response, NextFunction } from 'express';

export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[HTTP] ${req.method} ${req.path} ${res.statusCode} — ${Date.now() - start}ms`);
  });
  next();
}