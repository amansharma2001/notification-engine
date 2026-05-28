import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import mongoose from 'mongoose';
import { EventEmitter } from 'events';
import { config } from './config';

import { MongoNotificationRepository } from './infrastructure/database/mongo-notification.repository';
import { MongoUserPreferenceRepository } from './infrastructure/database/mongo-user-preference.repository';
import { RedisCacheService } from './infrastructure/cache/redis-cache.service';
import { EmailChannel } from './infrastructure/channels/email.channel';
import { SMSChannel } from './infrastructure/channels/sms.channel';
import { PushChannel } from './infrastructure/channels/push.channel';
import { InAppChannel } from './infrastructure/channels/inapp.channel';
import { WebSocketGateway } from './infrastructure/websocket/ws-gateway';

import { SendNotificationUseCase } from './application/use-cases/send-notification.use-case';
import { DeliverNotificationUseCase } from './application/use-cases/deliver-notification.use-case';
import { RetryNotificationsUseCase } from './application/use-cases/retry-notifications.use-case';

import { createNotificationRouter } from './presentation/controllers/notification.controller';
import { createAuthRouter } from './presentation/controllers/auth.controller';
import { createHealthRouter } from './presentation/controllers/health.controller';
import { errorHandler } from './presentation/middleware/error-handler.middleware';
import { loggingMiddleware } from './presentation/middleware/logging.middleware';

async function bootstrap(): Promise<void> {
  // 1. Database
  await mongoose.connect(config.mongoUri);
  console.log('[DB] MongoDB connected');

  // 2. Cache
  const cacheService = new RedisCacheService(config.redis.host, config.redis.port);

  // 3. Repositories (Repository Pattern)
  const notificationRepo = new MongoNotificationRepository();
  const userPrefRepo = new MongoUserPreferenceRepository();

  // 4. Event Bus (Observer Pattern)
  const eventBus = new EventEmitter();
  eventBus.setMaxListeners(20);

  // 5. Channel Strategies (Strategy Pattern)
  const channels = [new EmailChannel(), new SMSChannel(), new PushChannel(), new InAppChannel(cacheService)];

  // 6. Use Cases
  const sendUseCase = new SendNotificationUseCase(notificationRepo, userPrefRepo, eventBus);
  const deliverUseCase = new DeliverNotificationUseCase(notificationRepo, channels, cacheService, eventBus);
  const retryUseCase = new RetryNotificationsUseCase(notificationRepo, eventBus);

  // 7. Event Handlers (Observer Pattern)
  eventBus.on('notification.created', async (data: { notificationId: string }) => {
    await deliverUseCase.execute(data.notificationId);
  });
  eventBus.on('notification.delivered', (data: any) => {
    console.log(`[Event] ✓ ${data.notificationId} delivered via ${data.channel}`);
  });
  eventBus.on('notification.dlq', (data: any) => {
    console.log(`[DLQ] ✗ ${data.notificationId} permanently failed: ${data.error}`);
  });

  // 8. Retry scheduler (every 30s)
  setInterval(async () => {
    try { await retryUseCase.execute(); } catch (e: any) { console.error('[Retry]', e.message); }
  }, 30_000);

  // 9. Express
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(loggingMiddleware);

  app.use('/auth', createAuthRouter(config.jwt.secret));
  app.use('/notifications', createNotificationRouter(sendUseCase, config.jwt.secret));

  const server = createServer(app);
  const wsGateway = new WebSocketGateway(server, cacheService);

  app.use('/health', createHealthRouter(() => wsGateway.getConnectedCount()));
  app.use(errorHandler);

  server.listen(config.port, () => {
    console.log(`[Server] http://localhost:${config.port}`);
    console.log(`[WS] ws://localhost:${config.port}/ws`);
  });
}

bootstrap().catch((err) => { console.error('[Fatal]', err); process.exit(1); });