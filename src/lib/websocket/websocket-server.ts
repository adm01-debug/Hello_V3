import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

export class WebSocketServer {
  private io: SocketIOServer;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGIN,
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

      try {
        // Verify JWT token here
        socket.data.user = { id: 'user-id' };
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });
  }

  private setupHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`User connected: ${socket.data.user.id}`);

      socket.join(`user:${socket.data.user.id}`);

      socket.on('call:start', (data) => this.handleCallStart(socket, data));
      socket.on('call:end', (data) => this.handleCallEnd(socket, data));

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.data.user.id}`);
      });
    });
  }

  private handleCallStart(socket: Socket, data: any): void {
    socket.broadcast.emit('call:started', {
      userId: socket.data.user.id,
      callId: data.callId,
    });
  }

  private handleCallEnd(socket: Socket, data: any): void {
    socket.broadcast.emit('call:ended', {
      userId: socket.data.user.id,
      callId: data.callId,
    });
  }

  public emitToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }
}
