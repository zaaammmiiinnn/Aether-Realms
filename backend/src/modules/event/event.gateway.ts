import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../../config/redis.service';

@WebSocketGateway({
  cors: { origin: '*' }, // Dev config
  namespace: '/events'
})
export class EventGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private redis: RedisService) {
    // Subscribe to Redis PubSub for cross-instance scaling
    // Server-wide messages broadcasted by the primary event coordinator
    this.redis.subscribe('world_events', (msg) => {
      this.server.emit('world_event_update', msg);
    });
  }

  handleConnection(client: Socket) {
    console.log(`Client Connected to Events Gateway: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client Disconnected from Events Gateway: ${client.id}`);
  }

  // Example: Client manually pushing event progress (normally done via internal service)
  @SubscribeMessage('contribute_progress')
  async handleContributeProgress(client: Socket, payload: { eventId: string, amount: number }) {
    const { eventId, amount } = payload;

    // Fast increment in Redis
    const newTotal = await this.redis.increment(`event:${eventId}:progress`, amount);
    
    // Throttle broadcasts if necessary, but broadcast new progress using Pub/Sub
    // So all other Node instances also emit to their connected WebSockets
    await this.redis.publish('world_events', {
      type: 'METEOR_SHOWER_PROGRESS',
      eventId: eventId,
      globalProgress: { total_mined: newTotal }
    });
  }
}
