import {tokenService} from '@/services/tokenService';
import {API_BASE_URL} from '@/config/env';
import {Listing} from "@/types/profile";
import {authApiService} from "@services/api/authApi";
import {formatListingForDisplay} from '@shared/utils/listingFormatter';

export interface CreateListingRequest {
    type: string;
    title: string;
    description: string;
    price: number;
    pricePeriod: string;
    currency: string;
    location?: {
        longitude: number;
        latitude: number;
    };
    address: string;
    size?: number;
    photoUrls?: string[];
    amenities?: Record<string, string>;
    availability: Array<{
        start: string;
        end: string;
    }>;
}

export type ListingResponse = Listing;

class ListingApiService {
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

    async createListing(listingData: CreateListingRequest): Promise<ListingResponse> {
        const result = await this.request<ListingResponse>('/listings', {
            method: 'POST',
            body: JSON.stringify(listingData),
        });
        return formatListingForDisplay(result);
    }

    async getListings(): Promise<ListingResponse[]> {
        try {
            const url = `${API_BASE_URL}/listings`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const listings = data.listings || [];
            return listings.map(formatListingForDisplay);

        } catch (error) {
            const response = await this.request<{ listings: ListingResponse[] }>('/listings');
            const listings = response.listings || [];
            return listings.map(formatListingForDisplay);
        }
    }

    async getMyListings(): Promise<ListingResponse[]> {
        try {
            const profileResponse = await authApiService.getProfile();
            if (profileResponse.success && profileResponse.data) {
                const userId = profileResponse.data.id;

                const response = await this.request<{ listings: ListingResponse[] }>(`/listings/user/${userId}`);
                const listings = response.listings || [];

                return listings.map(formatListingForDisplay);
            }
            console.log('❌ No profile data');
            return [];
        } catch (error) {
            console.error('Error getting my listings:', error);
            return [];
        }
    }

    async getListingById(id: number): Promise<ListingResponse> {
        const listing = await this.request<ListingResponse>(`/listings/${id}`);

        return formatListingForDisplay(listing);
    }

    async updateListing(id: number, listingData: Partial<CreateListingRequest>): Promise<ListingResponse> {
        const listing = await this.request<ListingResponse>(`/listings/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(listingData),
        });

        return formatListingForDisplay(listing);
    }

    async deleteListing(id: number): Promise<void> {
        await this.request(`/listings/${id}`, {
            method: 'DELETE',
        });
    }
}

export const listingApiService = new ListingApiService();