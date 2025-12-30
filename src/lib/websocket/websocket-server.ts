import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

export class WebSocketServer {
  private io: SocketIOServer;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGIN || '*',
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupHandlers();
  }

  private setupMiddleware(): void {
    this.io.use(async (socket: Socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      socket.data.user = { id: 'user-id', email: 'user@example.com' };
      next();
    });
  }

  private setupHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`User connected: ${socket.data.user.id}`);
      socket.join(`user:${socket.data.user.id}`);

      socket.on('call:start', (data) => {
        socket.broadcast.emit('call:started', {
          userId: socket.data.user.id,
          callId: data.callId,
        });
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.data.user.id}`);
      });
    });
  }

  public emitToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }
}
