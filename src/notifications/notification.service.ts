import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<number, Set<string>>();

  handleConnection(socket: any) {
    const userId = Number(socket.handshake.query.userId);

    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }

    const userSockets = this.onlineUsers.get(userId); // could be undefined
    if (userSockets) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      userSockets.add(socket.id);
    }

    socket.join(String(userId));
  }

  handleDisconnect(socket: any) {
    const userId = Number(socket.handshake.query.userId);

    const userSockets = this.onlineUsers.get(userId);
    if (userSockets) {
      // type guard
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        this.onlineUsers.delete(userId);
      }
    }
  }

  isUserOnline(userId: number) {
    return this.onlineUsers.has(userId);
  }

  sendToUser(userId: number, payload: any) {
    this.server.to(String(userId)).emit('notification', payload);
  }

  sendToAll(payload: any) {
    this.server.emit('notification', payload);
  }
}
