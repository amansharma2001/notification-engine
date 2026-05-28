# Distributed Real-Time Notification Engine

A production-grade **multi-channel notification system** built with **Express**, **TypeScript**, and **Clean Architecture**. Supports email, SMS, push, and real-time in-app notifications with priority routing, dead-letter queue retry, and WebSocket delivery.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Presentation Layer                             │
│     Controllers  │  Auth Middleware  │  Validation  │  Logging      │
├─────────────────────────────────────────────────────────────────────┤
│                      Application Layer                              │
│          Use Cases  │  DTOs  │  Event Bus Interface                 │
├─────────────────────────────────────────────────────────────────────┤
│                       Domain Layer (pure)                           │
│  Entities  │  Value Objects  │  Repository Interfaces  │  Events   │
├─────────────────────────────────────────────────────────────────────┤
│                     Infrastructure Layer                            │
│  MongoDB Repos  │  Redis Cache  │  Channel Workers  │  WebSocket   │
└─────────────────────────────────────────────────────────────────────┘
```

### Notification Flow

```
Client Request
     │
     ▼
┌──────────┐     ┌──────────────┐     ┌─────────────────────────┐
│ REST API │ ──→ │  Priority    │ ──→ │  Fan-out to channels    │
│ (auth +  │     │  Router      │     │                         │
│ validate)│     │  + quiet hrs │     │  ┌─────┐ ┌───┐ ┌────┐  │
└──────────┘     └──────────────┘     │  │Email│ │SMS│ │Push│  │
                                      │  └──┬──┘ └─┬─┘ └─┬──┘  │
                                      │     │      │     │      │
                                      └─────┼──────┼─────┼──────┘
                                            │      │     │
                     ┌──────────────────────┼──────┼─────┘
                     │                      │      │
                     ▼                      ▼      ▼
              ┌──────────┐          ┌──────────────────┐
              │ MongoDB  │          │  Redis Pub/Sub   │
              │ delivery │          │       │          │
              │ log      │          │       ▼          │
              └──────────┘          │  ┌──────────┐   │
                                    │  │WebSocket │   │
                     ▲              │  │ Gateway  │   │
                     │              │  └──────────┘   │
              ┌──────────┐          └──────────────────┘
              │   DLQ    │               In-App
              │  retry   │──── exponential backoff ────→ re-deliver
              │  (3 max) │
              └──────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Express + TypeScript | Lightweight, manual DI, no framework magic |
| Database | MongoDB + Mongoose | Notification storage, delivery tracking, user preferences |
| Cache | Redis | Pub/Sub for real-time in-app delivery |
| Real-time | WebSocket (ws) | Live notification delivery to connected clients |
| Auth | JWT | Token-based authentication |
| Infra | Docker Compose | One-command local setup |

## Design Patterns (6 total)

| Pattern | Where | Why |
|---------|-------|-----|
| **Strategy** | `INotificationChannel` → `EmailChannel`, `SMSChannel`, `PushChannel`, `InAppChannel` | Adding WhatsApp or Slack takes one new class, zero changes to existing code |
| **Repository** | `INotificationRepository` → `MongoNotificationRepository` | Swap MongoDB for DynamoDB by implementing one interface |
| **Observer** | `EventEmitter` for async notification delivery | Send use case emits events, delivery use case handles them — completely decoupled |
| **Factory** | Channel map in `DeliverNotificationUseCase` | Routes to correct channel implementation based on notification type |
| **Builder** | `Notification` entity with domain methods | Encapsulates retry logic, backoff calculation, status transitions inside the entity |
| **Circuit Breaker** | DLQ with exponential backoff (5s → 25s → 125s) | Failed deliveries retry 3 times with increasing delays, then move to dead-letter queue |

## Key System Design Features

### Priority-Based Routing
- **Critical**: Bypasses quiet hours, bypasses batching, delivered immediately
- **Standard**: Respects user preferences and quiet hours
- **Bulk**: Rate-limited, batched, respects daily limits

### Fan-Out Delivery
One API call can target multiple channels simultaneously. Each channel gets its own notification record for independent tracking and retry.

### Idempotency
Duplicate detection within 5-minute windows prevents the same notification from being sent twice — critical for at-least-once delivery guarantees.

### Dead-Letter Queue (DLQ)
```
Attempt 1 → fail → retry after 5s
Attempt 2 → fail → retry after 25s
Attempt 3 → fail → moved to DLQ (permanent failure logged)
```

### Real-Time In-App Notifications
```
InAppChannel → Redis Pub/Sub → WebSocket Gateway → Connected Clients
```
Sub-200ms delivery to connected WebSocket clients. Clients that aren't connected receive notifications when they reconnect.

### User Preferences
Per-user configuration for channel toggles and quiet hours:
```json
{
  "channels": { "email": true, "sms": false, "push": true, "inapp": true },
  "quietStart": "22:00",
  "quietEnd": "07:00"
}
```

## Clean Architecture Layers

```
domain/                     # Zero dependencies — pure business logic
├── entities/               # Notification (with retry logic), UserPreference
├── value-objects/          # Priority, Channel, DeliveryStatus (enums + behavior)
├── interfaces/             # Repository & service contracts
├── events/                 # Event type definitions
└── exceptions/             # Domain-specific errors

application/                # Orchestration — depends only on domain
├── use-cases/              # SendNotification, DeliverNotification, RetryNotifications
├── dtos/                   # Request validation
└── interfaces/             # EventBus interface

infrastructure/             # External systems — implements domain interfaces
├── database/               # Mongoose schemas + MongoDB repository implementations
├── cache/                  # Redis cache + Pub/Sub
├── channels/               # Email, SMS, Push, InApp (Strategy implementations)
└── websocket/              # WebSocket gateway for real-time delivery

presentation/               # HTTP layer — thin, delegates to use cases
├── controllers/            # Auth, Notification, Health routes
└── middleware/              # JWT auth, error handling, logging

config/                     # Environment configuration

index.ts                    # Composition root — manual DI wiring
```

### Manual Dependency Injection

All dependencies are wired by hand in `src/index.ts` — no framework container, no decorators, no magic. This demonstrates understanding of DI as a principle, not just a framework feature:

```typescript
// Repositories
const notificationRepo = new MongoNotificationRepository();
const userPrefRepo = new MongoUserPreferenceRepository();

// Event Bus (Observer Pattern)
const eventBus = new EventEmitter();

// Channel Strategies
const channels = [new EmailChannel(), new SMSChannel(), new PushChannel(), new InAppChannel(cacheService)];

// Use Cases (wired with dependencies)
const sendUseCase = new SendNotificationUseCase(notificationRepo, userPrefRepo, eventBus);
const deliverUseCase = new DeliverNotificationUseCase(notificationRepo, channels, cacheService, eventBus);
```

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+

### Setup

```bash
git clone https://github.com/amansharma2001/notification-engine.git
cd notification-engine

# Start infrastructure
docker compose up -d

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Build and run
npm run build
node dist/index.js
```

### API Usage

```bash
# 1. Get a JWT token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001"}' | jq -r '.token')

# 2. Send notification to all channels
curl -s -X POST http://localhost:3000/notifications/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-001",
    "eventType": "order.confirmed",
    "channels": ["email", "sms", "push", "inapp"],
    "priority": "standard",
    "payload": {
      "subject": "Order Confirmed",
      "body": "Your order #12345 has been confirmed."
    }
  }' | jq

# 3. Send critical alert (bypasses quiet hours)
curl -s -X POST http://localhost:3000/notifications/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-001",
    "eventType": "security.alert",
    "channels": ["email", "push", "inapp"],
    "priority": "critical",
    "payload": {
      "subject": "Security Alert",
      "body": "New login from unknown device in Delhi."
    }
  }' | jq

# 4. Connect to WebSocket for real-time notifications
npx wscat -c "ws://localhost:3000/ws?userId=user-001"

# 5. Health check
curl -s http://localhost:3000/health | jq
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/token` | No | Generate JWT token |
| GET | `/health` | No | Health check + WebSocket connection count |
| POST | `/notifications/send` | JWT | Send notification to specified channels |

## System Design Decisions

### Why MongoDB over PostgreSQL?

Notification payloads vary wildly — order confirmations have different fields than security alerts or marketing emails. MongoDB's flexible schema handles this naturally without migration headaches. The delivery log benefits from document-oriented storage where each notification is a self-contained record.

### Why EventEmitter over Kafka?

For a single-node deployment, Node's EventEmitter provides the same Observer pattern without the operational overhead of running a Kafka cluster. The architecture uses the `IEventBus` interface — swapping to Kafka requires implementing one interface, not rewriting the application.

### Why Redis Pub/Sub for In-App?

In-app notifications need sub-200ms delivery. Redis Pub/Sub gives fire-and-forget messaging to the WebSocket gateway without polling. The WebSocket server subscribes to a Redis channel and pushes to connected clients instantly.

### Why Manual DI over NestJS?

This project deliberately avoids framework DI to demonstrate the principle behind it. Every dependency is explicitly constructed and passed — no decorators, no module system, no container. The composition root (`src/index.ts`) reads like a blueprint of the entire system.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `MONGO_URI` | mongodb://localhost:27017/notifications | MongoDB connection string |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `JWT_SECRET` | — | JWT signing secret |

## License

MIT