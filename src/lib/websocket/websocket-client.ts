import io, { Socket } from 'socket.io-client';

/**
 * WebSocket event types
 */
export interface WebSocketEvents {
  'call:started': (data: { userId: string; callId: string }) => void;
  'call:ended': (data: { userId: string; callId: string; duration?: number }) => void;
  error: (data: { message: string }) => void;
}

/**
 * Connection state
 */
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

/**
 * WebSocketClient - Production-ready WebSocket client
 * 
 * Features:
 * - Auto-reconnection
 * - Typed events
 * - Connection state management
 * - Error handling
 * - Event listeners cleanup
 * 
 * @class WebSocketClient
 */
export class WebSocketClient {
  private socket: Socket | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private readonly maxReconnectAttempts: number = 5;
  private reconnectAttempts: number = 0;
  private eventListeners = new Map<string, Set<Function>>();

  constructor(
    private readonly token: string,
    private readonly serverUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  ) {
    this.connect();
  }

  /**
   * Connect to WebSocket server
   * @public
   */
  public connect(): void {
    if (this.socket?.connected) {
      console.warn('WebSocket already connected');
      return;
    }

    this.connectionState = ConnectionState.CONNECTING;

    this.socket = io(this.serverUrl, {
      auth: { token: this.token },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.setupEventHandlers();
  }

  /**
   * Setup built-in event handlers
   * @private
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.connectionState = ConnectionState.CONNECTED;
      this.reconnectAttempts = 0;
      console.log('✅ WebSocket connected');
      this.notifyListeners('connect', {});
    });

    this.socket.on('disconnect', (reason) => {
      this.connectionState = ConnectionState.DISCONNECTED;
      console.log('❌ WebSocket disconnected:', reason);
      this.notifyListeners('disconnect', { reason });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.connectionState = ConnectionState.CONNECTED;
      console.log(`✅ WebSocket reconnected (attempt ${attemptNumber})`);
      this.notifyListeners('reconnect', { attemptNumber });
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.connectionState = ConnectionState.RECONNECTING;
      this.reconnectAttempts = attemptNumber;
      console.log(`🔄 Reconnecting... (attempt ${attemptNumber}/${this.maxReconnectAttempts})`);
    });

    this.socket.on('reconnect_failed', () => {
      this.connectionState = ConnectionState.ERROR;
      console.error('❌ WebSocket reconnection failed');
      this.notifyListeners('reconnect_failed', {});
    });

    this.socket.on('error', (error) => {
      this.connectionState = ConnectionState.ERROR;
      console.error('❌ WebSocket error:', error);
      this.notifyListeners('error', { error });
    });
  }

  /**
   * Subscribe to event
   * @public
   */
  public on<K extends keyof WebSocketEvents>(
    event: K,
    callback: WebSocketEvents[K]
  ): void {
    if (!this.socket) {
      console.warn('Socket not initialized');
      return;
    }

    // Store listener for cleanup
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);

    // Register with socket
    this.socket.on(event, callback as any);
  }

  /**
   * Unsubscribe from event
   * @public
   */
  public off<K extends keyof WebSocketEvents>(
    event: K,
    callback: WebSocketEvents[K]
  ): void {
    if (!this.socket) return;

    this.socket.off(event, callback as any);
    this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Emit event to server
   * @public
   */
  public emit(event: string, data: unknown): void {
    if (!this.socket?.connected) {
      console.warn('Cannot emit: WebSocket not connected');
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Emit with acknowledgment
   * @public
   */
  public emitWithAck<T = unknown>(
    event: string,
    data: unknown
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit(event, data, (response: T) => {
        resolve(response);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Acknowledgment timeout'));
      }, 5000);
    });
  }

  /**
   * Disconnect from server
   * @public
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectionState = ConnectionState.DISCONNECTED;
  }

  /**
   * Reconnect to server
   * @public
   */
  public reconnect(): void {
    this.disconnect();
    this.connect();
  }

  /**
   * Get connection state
   * @public
   */
  public getState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   * @public
   */
  public isConnected(): boolean {
    return this.socket?.connected === true;
  }

  /**
   * Notify all listeners of an event
   * @private
   */
  private notifyListeners(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Clean up all listeners
   * @public
   */
  public removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
    this.eventListeners.clear();
  }
}
