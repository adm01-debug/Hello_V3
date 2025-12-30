import io from 'socket.io-client';

export class WebSocketClient {
  private socket: any;

  constructor(private token: string) {
    this.connect();
  }

  private connect(): void {
    this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
      auth: { token: this.token },
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    this.socket.on('call:started', (data: any) => {
      console.log('New call started:', data);
    });
  }

  public emit(event: string, data: any): void {
    this.socket.emit(event, data);
  }

  public disconnect(): void {
    this.socket.disconnect();
  }
}
