import { EventEmitter } from 'events';
import { logger } from "@/lib/logger";

export interface WebSocketMessage {
  type: 'recommendation' | 'price_alert' | 'portfolio_update' | 'market_update' | 'tip' | 'system';
  data: any;
  timestamp: string;
}

class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isIntentionallyClosed = false;

  constructor() {
    super();
  }

  connect(token?: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      logger.debug('WebSocket already connected');
      return;
    }

    this.isIntentionallyClosed = false;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ||
      (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.rangaone.finance')
        .replace('https://', 'wss://')
        .replace('http://', 'ws://');

    try {
      // Append token as query parameter if available
      const url = token ? `${wsUrl}/ws?token=${encodeURIComponent(token)}` : `${wsUrl}/ws`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        logger.debug('WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connected');
        this.startHeartbeat();

        // Subscribe to notification channels
        this.send({
          type: 'subscribe',
          channels: ['recommendations', 'price_alerts', 'portfolio_updates', 'market_updates', 'tips']
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          // Removed verbose message logging of every single message

          // Handle heartbeat
          if (message.type === 'system' && message.data?.action === 'pong') {
            return;
          }

          // Only log significant messages in debug
          if (message.type !== 'system') {
            logger.debug('WebSocket message received:', message.type);
          }

          // Emit specific events based on message type
          this.emit('message', message);
          this.emit(message.type, message.data);
        } catch (error) {
          logger.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        logger.error('WebSocket error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = (event) => {
        logger.debug('WebSocket disconnected', event.code);
        this.stopHeartbeat();
        this.emit('disconnected');

        // Attempt to reconnect if not intentionally closed
        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      logger.error('Error creating WebSocket connection:', error);
      this.emit('error', error);
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'system', data: { action: 'ping' } });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, Math.min(this.reconnectAttempts - 1, 3));

    logger.debug(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectInterval = setTimeout(() => {
      logger.debug('Attempting to reconnect...');
      this.connect();
    }, delay);
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      logger.warn('WebSocket is not connected. Message not sent:', data);
    }
  }

  disconnect() {
    this.isIntentionallyClosed = true;

    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const wsService = new WebSocketService();