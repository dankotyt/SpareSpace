import { io, Socket } from 'socket.io-client';
import { tokenService } from './tokenService';
import { API_BASE_URL } from '@/config/env';

class SocketService {
    private socket: Socket | null = null;
    private isConnected = false;
    private messageHandlers: Map<string, Function[]> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    async connect(): Promise<boolean> {
        try {
            const token = await tokenService.getToken();
            if (!token) {
                return false;
            }

            if (!API_BASE_URL) {
                return false;
            }

            const wsUrl = API_BASE_URL.replace('http', 'ws');
            this.socket = io(`${wsUrl}/chat`, {
                transports: ['websocket', 'polling'],
                auth: {
                    token: token
                },
                query: {
                    token: token
                }
            });

            this.socket.on('connect', () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
            });

            this.socket.on('disconnect', (reason: string) => {
                this.isConnected = false;
                this.handleReconnect();
            });

            this.socket.on('connect_error', (error: Error) => {
                this.isConnected = false;
            });

            this.socket.on('error', (error: Error) => {
                console.error('❌ Socket.IO error:', error);
            });

            this.socket.onAny((eventName: string, ...args: any[]) => {
                this.handleMessage(eventName, args[0]);
            });

            return true;
        } catch (error) {
            console.error('❌ Error connecting Socket.IO:', error);
            return false;
        }
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;

            setTimeout(() => {
                this.connect();
            }, 3000 * this.reconnectAttempts);
        }
    }

    private handleMessage(event: string, data: any) {
        const handlers = this.messageHandlers.get(event) || [];

        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`❌ Error in Socket.IO handler for event ${event}:`, error);
            }
        });
    }

    joinRoom(conversationId: number) {
        if (this.socket && this.isConnected) {
            this.socket.emit('joinRoom', { conversationId });
        } else {
            console.warn('❌ Socket not connected, cannot join room');
        }
    }

    leaveRoom(conversationId: number) {
        if (this.socket && this.isConnected) {
            this.socket.emit('leaveRoom', { conversationId });
        }
    }

    async sendMessage(conversationId: number, text: string): Promise<void> {
        console.log('🔌 WebSocket sendMessage called:', { conversationId, text, connected: this.isConnected });

        if (this.socket && this.isConnected) {
            console.log('📤 Emitting sendMessage via WebSocket');
            this.socket.emit('sendMessage', { conversationId, text });
            console.log('✅ sendMessage emitted successfully');
        } else {
            console.error('❌ WebSocket not connected!');
            throw new Error('Socket not connected');
        }
    }

    markAsRead(conversationId: number) {
        if (this.socket && this.isConnected) {
            this.socket.emit('markAsRead', { conversationId });
        }
    }

    on(event: string, handler: Function) {
        if (!this.messageHandlers.has(event)) {
            this.messageHandlers.set(event, []);
        }
        this.messageHandlers.get(event)!.push(handler);
    }

    off(event: string, handler?: Function) {
        if (!handler) {
            this.messageHandlers.delete(event);
        } else {
            const handlers = this.messageHandlers.get(event) || [];
            const filteredHandlers = handlers.filter(h => h !== handler);
            this.messageHandlers.set(event, filteredHandlers);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.messageHandlers.clear();
        }
    }

    get connected(): boolean {
        return this.isConnected;
    }
}

export const socketService = new SocketService();