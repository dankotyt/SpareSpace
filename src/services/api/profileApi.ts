import {UserProfile, UserStats, Listing, Review, FormattedListing} from '@/types/profile';
import {tokenService} from "@services/tokenService";
import { API_BASE_URL } from '@/config/env';
import {listingApiService} from "@services/api/listingApi";
import {Booking, bookingsApiService} from "@services/api/bookingsApi";

export interface ProfileResponse {
    success: boolean;
    data?: UserProfile;
    message?: string;
}

export interface ReviewsResponse {
    success: boolean;
    data?: Review[];
    message?: string;
}

export interface ListingsResponse {
    success: boolean;
    data?: Listing[];
    message?: string;
}

export interface BookingsResponse {
    success: boolean;
    data?: Booking[];
    message?: string;
}

export interface StatsResponse {
    success: boolean;
    data?: UserStats;
    message?: string;
}

class ProfileApiService {
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = await tokenService.getToken();

        if (!token) {
            throw new Error('Токен авторизации не найден');
        }

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers,
            },
            ...options,
        };

        const response = await fetch(url, config);
        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
        }

        return responseData;
    }

    async getProfile(): Promise<ProfileResponse> {
        const response = await this.request<any>('/users/profile/me');
        return {
            success: true,
            data: response,
        };
    }

    async getPublicUserProfile(userId: number): Promise<ProfileResponse> {
        const response = await this.request<any>(`/users/${userId}`);
        return {
            success: true,
            data: response,
        };
    }

    async getUserReviews(userId: number): Promise<ReviewsResponse> {
        try {
            const response = await this.request<any>('/reviews');
            const allReviews = response.reviews || response || [];

            const userReviews = allReviews.filter((review: any) =>
                review.toUser && review.toUser.id === userId
            );

            return {
                success: true,
                data: userReviews,
            };
        } catch (error: any) {
            if (error.message?.includes('not found') || error.message?.includes('Not found')) {
                return {
                    success: true,
                    data: [],
                };
            }

            console.error('Error fetching user reviews:', error);
            return {
                success: false,
                data: [],
                message: 'Не удалось загрузить отзывы'
            };
        }
    }

    async getUserListings(userId: number, currentUserId?: number): Promise<ListingsResponse> {
        try {
            try {
                const url = `${API_BASE_URL}/listings/user/${userId}`;

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    const listings = data.listings || data || [];

                    const formattedListings: FormattedListing[] = listings.map((listing: any) => ({
                        ...listing,
                        displayPrice: `${Math.round(listing.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽${
                            listing.pricePeriod === 'HOUR' ? '/час' :
                                listing.pricePeriod === 'DAY' ? '/день' :
                                    listing.pricePeriod === 'WEEK' ? '/неделя' :
                                        listing.pricePeriod === 'MONTH' ? '/месяц' : ''
                        }`,
                        displayType: listing.type === 'PARKING' ? 'Парковочное место' :
                            listing.type === 'GARAGE' ? 'Гараж' :
                                listing.type === 'STORAGE' ? 'Кладовая' : 'Другое',
                        displayPriceShort: `${Math.round(listing.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽`
                    }));

                    return {
                        success: true,
                        data: formattedListings,
                    };
                }
            } catch (publicError) {
                console.log('Public endpoint failed, trying authenticated...');
            }

            const listings = await listingApiService.getListings();

            const userListings = listings.filter(listing => {
                return listing.userId === userId;
            });

            const formattedListings: FormattedListing[] = userListings.map(listing => {
                if ((listing as any).displayPrice) {
                    return listing as FormattedListing;
                }

                const formattedPrice = `${Math.round(listing.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽${
                    listing.pricePeriod === 'HOUR' ? '/час' :
                        listing.pricePeriod === 'DAY' ? '/день' :
                            listing.pricePeriod === 'WEEK' ? '/неделя' :
                                listing.pricePeriod === 'MONTH' ? '/месяц' : ''
                }`;

                const formattedType = listing.type === 'PARKING' ? 'Парковочное место' :
                    listing.type === 'GARAGE' ? 'Гараж' :
                        listing.type === 'STORAGE' ? 'Кладовая' : 'Другое';

                return {
                    ...listing,
                    displayPrice: formattedPrice,
                    displayType: formattedType,
                    displayPriceShort: `${Math.round(listing.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽`
                } as FormattedListing;
            });

            return {
                success: true,
                data: formattedListings,
            };

        } catch (error) {
            console.error('❌ Error fetching user listings:', error);
            return {
                success: false,
                data: [],
                message: 'Не удалось загрузить объявления'
            };
        }
    }

    async getUserBookings(): Promise<BookingsResponse> {
        try {
            const response = await bookingsApiService.findAll({});
            const activeBookings = response.bookings.filter(booking => booking.status !== 'CANCELLED');

            return {
                success: true,
                data: activeBookings,
            };
        } catch (error) {
            console.error('Error fetching bookings:', error);
            return {
                success: false,
                data: [],
                message: 'Не удалось загрузить бронирования'
            };
        }
    }

    async getUserStats(userId: number): Promise<StatsResponse> {
        try {
            const [listingsResponse, bookingsResponse, reviewsResponse] = await Promise.all([
                this.getUserListings(userId),
                this.getUserBookings(),
                this.getUserReviews(userId)
            ]);

            const listings = Array.isArray(listingsResponse.data) ? listingsResponse.data : [];
            const bookings = Array.isArray(bookingsResponse.data) ? bookingsResponse.data : [];
            const reviews = Array.isArray(reviewsResponse.data) ? reviewsResponse.data : [];

            const stats: UserStats = {
                totalListings: listings.length,
                activeListings: listings.filter(l => l.status === 'ACTIVE').length,
                totalBookings: bookings.length,
                pendingBookings: bookings.filter(b => b.status === 'PENDING').length,
                totalReviews: reviews.length,
                averageRating: reviews.length > 0
                    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
                    : 0
            };

            return {
                success: true,
                data: stats,
            };
        } catch (error) {
            return {
                success: true,
                data: {
                    totalListings: 0,
                    activeListings: 0,
                    totalBookings: 0,
                    pendingBookings: 0,
                    totalReviews: 0,
                    averageRating: 0
                }
            };
        }
    }

    async getFullUserData(userId: number, currentUserId?: number) {
        const [
            profileResponse,
            reviewsResponse,
            listingsResponse,
            bookingsResponse,
            statsResponse
        ] = await Promise.all([
            this.getProfile(),
            this.getUserReviews(userId),
            this.getUserListings(userId, currentUserId),
            this.getUserBookings(),
            this.getUserStats(userId)
        ]);

        return {
            profile: profileResponse.data!,
            reviews: Array.isArray(reviewsResponse.data) ? reviewsResponse.data : [],
            listings: Array.isArray(listingsResponse.data) ? listingsResponse.data : [],
            bookings: Array.isArray(bookingsResponse.data) ? bookingsResponse.data : [],
            stats: statsResponse.data || {
                totalListings: 0,
                activeListings: 0,
                totalBookings: 0,
                pendingBookings: 0,
                totalReviews: 0,
                averageRating: 0
            }
        };
    }

    async updateProfile(profileData: Partial<UserProfile>): Promise<ProfileResponse> {
        const userId = await this.getCurrentUserId();
        const response = await this.request<any>(`/users/${userId}`, {
            method: 'PATCH',
            body: JSON.stringify(profileData),
        });

        return {
            success: true,
            data: response,
        };
    }

    private async getCurrentUserId(): Promise<number> {
        const token = await tokenService.getToken();
        if (!token) {
            throw new Error('Токен не найден');
        }
        return 0;
    }
}

export const profileApiService = new ProfileApiService();