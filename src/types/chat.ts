export interface Conversation {
    id: number;
    participant1: {
        id: number;
        firstName: string;
        lastName: string;
        avatar?: string;
    };
    participant2: {
        id: number;
        firstName: string;
        lastName: string;
        avatar?: string;
    };
    listing?: {
        id: number;
        title: string;
    };
    lastMessageAt: string;
    unreadCount?: number;
}

export interface Message {
    id: number;
    text: string;
    sender: {
        id: number;
        firstName: string;
        lastName: string;
        avatar?: string;
    };
    sentAt: string;
    isRead: boolean;
    conversationId?: number;
}

export interface GetConversationsDto {
    limit: number;
    offset: number;
}

export interface GetMessagesDto {
    limit: number;
    offset: number;
}

export interface CreateConversationDto {
    participantId: number;
    listingId?: number;
}