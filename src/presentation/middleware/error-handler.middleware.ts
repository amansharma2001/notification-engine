import { Request, Response, NextFunction } from 'express';
import { DomainException } from '../../domain/exceptions/domain.exception';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error(`[Error] ${err.message}`);
  if (err instanceof DomainException) { res.status(400).json({ error: err.message, code: err.code }); return; }
  res.status(500).json({ error: 'Internal server error' });
}