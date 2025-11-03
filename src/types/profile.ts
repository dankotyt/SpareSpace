export interface UserProfile {
    id: number;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    patronymic?: string;
    rating: number;
    twoFaEnabled: boolean;
    verified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Review {
    id: number;
    rating: number;
    comment: string;
    authorId: number;
    authorName: string;
    targetUserId: number;
    createdAt: string;
    updatedAt: string;
}

export interface Listing {
    id: number;
    title: string;
    description: string;
    address: string;
    price: number;
    pricePeriod: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
    type: 'PARKING' | 'GARAGE' | 'STORAGE' | 'OTHER';
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL' | 'REJECTED' | 'RENTED' | 'DRAFT';
    userId: number;
    createdAt: string;
    updatedAt: string;
    images?: string[];
}

export interface Booking {
    id: number;
    listingId: number;
    userId: number;
    startDate: string;
    endDate: string;
    totalPrice: number;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
    createdAt: string;
    updatedAt: string;
    listing?: Listing;
}

export interface UserStats {
    totalListings: number;
    activeListings: number;
    totalBookings: number;
    pendingBookings: number;
    totalReviews: number;
    averageRating: number;
}

export interface FormattedUserProfile {
    id: number;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    patronymic?: string;
    rating: number;
    twoFaEnabled: boolean;
    verified: boolean;
    createdAt: string;
    updatedAt: string;

    fullName: string;
    joinYear: string;
    reviewsCount: number;
    balance: number;

    reviews: Review[];
    listings: Listing[];
    bookings: Booking[];
    stats: UserStats;
}

export const getFullName = (profile: UserProfile): string => {
    return `${profile.firstName} ${profile.lastName} ${profile.patronymic || ''}`.trim();
};

export const getJoinYear = (createdAt: string): string => {
    return new Date(createdAt).getFullYear().toString();
};