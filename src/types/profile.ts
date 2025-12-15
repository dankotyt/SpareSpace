import {Booking} from "@services/api/bookingsApi";

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
    avatar?: string;
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

interface GeoJSONPoint {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
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
    photosJson?: string[];
    currency?: 'RUB' | string;
    size?: number;
    amenities?: any;
    availability?: Array<{
        start: string;
        end: string;
    }>;
    location?: string | GeoJSONPoint;
    views?: {
        total: number;
        daily: number;
    };
    contact?: {
        name: string;
        phone: string;
    };
}

export interface FormattedListing extends Listing {
    displayPrice: string;
    displayType: string;
    displayPriceShort: string;
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
    avatar?: string;

    fullName: string;
    joinYear: string;
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