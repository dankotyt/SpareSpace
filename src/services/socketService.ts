import { io, Socket } from 'socket.io-client';
import { tokenService } from './tokenService';
import { API_BASE_URL } from '@/config/env';

class SocketService {
    private socket: Socket | null = null;
    private isConnected = false;
    private messageHandlers: Map<string, Function[]> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private connectionPromise: Promise<boolean> | null = null;

    async connect(): Promise<boolean> {
        // Если уже есть promise подключения, возвращаем его
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = this.internalConnect();
        return this.connectionPromise;
    }

    private async internalConnect(): Promise<boolean> {
        try {
            const token = await tokenService.getToken();
            console.log('🔑 Token for WebSocket:', token ? 'Present' : 'Missing');

            if (!token) {
                console.error('❌ No token available');
                return false;
            }

            console.log('🌐 API_BASE_URL:', API_BASE_URL);

            if (!API_BASE_URL) {
                console.error('❌ API_BASE_URL is undefined!');
                return false;
            }

            // Преобразуем URL для WebSocket
            let wsUrl = API_BASE_URL;
            wsUrl = wsUrl.replace(/\/$/, '');

            if (wsUrl.startsWith('https://')) {
                wsUrl = wsUrl.replace('https://', 'wss://');
            } else if (wsUrl.startsWith('http://')) {
                wsUrl = wsUrl.replace('http://', 'ws://');
            }

            console.log('🔗 WebSocket URL:', wsUrl);

            this.socket = io(wsUrl, {
                transports: ['websocket', 'polling'],
                auth: { token },
                query: { token },
                timeout: 10000,
                reconnection: true,
                reconnectionAttempts: 3,
                reconnectionDelay: 1000,
            });

            return new Promise((resolve) => {
                const connectTimeout = setTimeout(() => {
                    console.error('⏰ WebSocket connection timeout');
                    resolve(false);
                }, 10000);

                // Успешное подключение
                this.socket!.on('connect', () => {
                    clearTimeout(connectTimeout);
                    console.log('✅ WebSocket connected successfully');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;

                    // Подписываемся на глобальные события
                    this.setupSocketListeners();

                    resolve(true);
                });

                // Ошибка подключения
                this.socket!.on('connect_error', (error: Error) => {
                    clearTimeout(connectTimeout);
                    console.error('❌ WebSocket connection error:', error.message);
                    this.isConnected = false;
                    resolve(false);
                });
            });

        } catch (error) {
            console.error('❌ Error connecting Socket.IO:', error);
            this.connectionPromise = null;
            return false;
        }
    }

    private setupSocketListeners() {
        if (!this.socket) return;

        this.socket.on('disconnect', (reason: string) => {
            console.log('❌ WebSocket disconnected:', reason);
            this.isConnected = false;
            this.connectionPromise = null;

            // Автоматический реконнект
            this.handleReconnect();
        });

        this.socket.on('connect_error', (error: Error) => {
            console.error('❌ WebSocket connect_error:', error.message);
            this.isConnected = false;
        });

        this.socket.on('error', (error: Error) => {
            console.error('❌ Socket.IO error:', error);
        });

        // Обработка всех входящих сообщений
        this.socket.onAny((eventName: string, ...args: any[]) => {
            console.log('📥 WebSocket event:', eventName, args[0]);
            this.handleMessage(eventName, args[0]);
        });
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = 1000 * this.reconnectAttempts;
            console.log(`🔄 Reconnecting attempt ${this.reconnectAttempts} in ${delay}ms`);

            setTimeout(async () => {
                await this.connect();
            }, delay);
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

    async joinRoom(conversationId: number): Promise<void> {
        if (!this.isConnected) {
            console.log('🔄 Socket not connected, attempting to connect first...');
            const connected = await this.connect();
            if (!connected) {
                console.error('❌ Failed to connect, cannot join room');
                return;
            }
        }

        if (this.socket) {
            console.log(`🔗 Joining room: chat:${conversationId}`);
            this.socket.emit('chat:join', { conversationId });
        } else {
            console.error('❌ Socket is null, cannot join room');
        }
    }

    leaveRoom(conversationId: number) {
        if (this.socket && this.isConnected) {
            this.socket.emit('chat:leave', { conversationId });
        }
    }

    async sendMessage(conversationId: number, text: string): Promise<void> {
        if (!this.isConnected) {
            console.log('🔄 Socket not connected, attempting to connect first...');
            const connected = await this.connect();
            if (!connected) {
                console.error('❌ Failed to connect, cannot send message');
                throw new Error('Socket not connected');
            }
        }

        if (this.socket && this.isConnected) {
            console.log('📤 Sending message:', { conversationId, text });
            this.socket.emit('message:send', { conversationId, text });
        } else {
            console.error('❌ WebSocket not connected!');
            throw new Error('Socket not connected');
        }
    }

    async markAsRead(conversationId: number, messageIds?: number[]): Promise<void> {
        if (!this.isConnected) {
            await this.connect();
        }

        if (this.socket && this.isConnected) {
            console.log('✅ Marking as read:', { conversationId, messageIds });
            this.socket.emit('message:read', {
                conversationId,
                messageIds: messageIds || []
            });
        }
    }

    editMessage(conversationId: number, messageId: number, newText: string) {
        if (this.socket && this.isConnected) {
            this.socket.emit('message:edit', {
                conversationId,
                messageId,
                newText
            });
        }
    }

    deleteMessages(conversationId: number, messageIds: number[]) {
        if (this.socket && this.isConnected) {
            this.socket.emit('message:delete', {
                conversationId,
                messageIds
            });
        }
    }

    subscribeToUserStatus(userId: number) {
        if (this.socket && this.isConnected) {
            this.socket.emit('user:status:subscribe', { userId });
        }
    }

    unsubscribeFromUserStatus(userId: number) {
        if (this.socket && this.isConnected) {
            this.socket.emit('user:status:unsubscribe', { userId });
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
            console.log('🔌 Disconnecting WebSocket');
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.connectionPromise = null;
            this.messageHandlers.clear();
        }
    }

    get connected(): boolean {
        return this.isConnected;
    }
}

export const socketService = new SocketService();

