import { Router, Response } from 'express';
import { SendNotificationUseCase } from '../../application/use-cases/send-notification.use-case';
import { validateSendNotificationDto } from '../../application/dtos/send-notification.dto';
import { AuthRequest, authMiddleware } from '../middleware/auth.middleware';

export function createNotificationRouter(useCase: SendNotificationUseCase, jwtSecret: string): Router {
  const router = Router();

  router.post('/send', authMiddleware(jwtSecret), async (req: AuthRequest, res: Response) => {
    const errors = validateSendNotificationDto(req.body);
    if (errors.length > 0) { res.status(400).json({ errors }); return; }
    try {
      const result = await useCase.execute(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  return router;
}