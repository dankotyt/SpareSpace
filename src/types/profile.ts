export interface UserProfile {
    id: number;
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
    patronymic?: string;
    rating: number;
    two_fa_enabled: boolean;
    verified: boolean;
    created_at: string;
    updated_at: string;
}

export interface Review {
    id: number;
    rating: number;
    comment: string;
    author_id: number;
    author_name: string;
    target_user_id: number;
    created_at: string;
    updated_at: string;
}

export interface Listing {
    id: number;
    title: string;
    description: string;
    address: string;
    price: number;
    type: 'parking' | 'garage' | 'pantry' | 'other';
    status: 'active' | 'inactive' | 'pending' | 'rented';
    user_id: number;
    created_at: string;
    updated_at: string;
    images?: string[];
}

export interface Booking {
    id: number;
    listing_id: number;
    user_id: number;
    start_date: string;
    end_date: string;
    total_price: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    created_at: string;
    updated_at: string;
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
    first_name: string;
    last_name: string;
    patronymic?: string;
    rating: number;
    two_fa_enabled: boolean;
    verified: boolean;
    created_at: string;
    updated_at: string;

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
    return `${profile.first_name} ${profile.last_name} ${profile.patronymic || ''}`.trim();
};

export const getJoinYear = (createdAt: string): string => {
    return new Date(createdAt).getFullYear().toString();
};