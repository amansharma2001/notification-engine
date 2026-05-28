import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { ICacheService } from '../../domain/interfaces/cache.service';

export class WebSocketGateway {
  private wss: WebSocketServer;
  private clients = new Map<string, Set<WebSocket>>();

  constructor(server: Server, private readonly cacheService: ICacheService) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url || '', 'http://localhost');
      const userId = url.searchParams.get('userId');
      if (!userId) { ws.close(1008, 'Missing userId'); return; }

      if (!this.clients.has(userId)) this.clients.set(userId, new Set());
      this.clients.get(userId)!.add(ws);
      console.log(`[WS] ${userId} connected. Total: ${this.clients.size}`);

      ws.on('close', () => {
        this.clients.get(userId)?.delete(ws);
        if (this.clients.get(userId)?.size === 0) this.clients.delete(userId);
      });
      ws.send(JSON.stringify({ type: 'connected', userId }));
    });

    this.cacheService.subscribe('inapp-notifications', (message) => {
      const data = JSON.parse(message);
      const sockets = this.clients.get(data.userId);
      if (sockets) {
        const payload = JSON.stringify({ type: 'notification', data });
        sockets.forEach((ws) => { if (ws.readyState === WebSocket.OPEN) ws.send(payload); });
      }
    });
  }

  getConnectedCount(): number { return this.clients.size; }
}