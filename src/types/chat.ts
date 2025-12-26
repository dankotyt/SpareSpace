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
    listing: {
        id: number;
        title: string;
        address: string;
        price: number;
        pricePeriod: string;
        firstPhotoUrl?: string;
        type?: string;
    };
    lastMessageAt: string;
    unreadCount?: number;
    lastMessage?: {
        text: string;
        senderId: number;
    };
}

export const getOtherParticipant = (conversation: Conversation, currentUserId: number) => {
    return conversation.participant1.id === currentUserId
        ? conversation.participant2
        : conversation.participant1;
};

export const getParticipantName = (conversation: Conversation, currentUserId: number) => {
    const otherParticipant = getOtherParticipant(conversation, currentUserId);
    return `${otherParticipant.firstName} ${otherParticipant.lastName}`.trim();
};

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
    conversation?: Conversation;
    readAt?: string | null;
    updatedAt?: string;
    deletedAt?: string | null;
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

export interface WsMessageResponse {
    message: Message;
    conversationId: number;
}

export interface WsMessagesReadResponse {
    conversationId: number;
    userId: number;
    messageIds: number[];
}

export type OptimisticMessage = Omit<Message, 'id'> & { id: number | string; _isOptimistic?: boolean };