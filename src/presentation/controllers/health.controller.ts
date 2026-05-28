import { Router, Request, Response } from 'express';

export function createHealthRouter(getWsCount: () => number): Router {
  const router = Router();
  router.get('/', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'notification-engine', uptime: process.uptime(), wsConnections: getWsCount(), timestamp: new Date().toISOString() });
  });
  return router;
}