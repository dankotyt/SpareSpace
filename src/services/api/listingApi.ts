import { tokenService } from '@/services/tokenService';
import { API_BASE_URL } from '@/config/env';
import {Listing} from "@/types/profile";
import {authApiService} from "@services/api/authApi";

export interface CreateListingRequest {
    type: 'PARKING' | 'STORAGE' | 'GARAGE';
    title: string;
    description?: string;
    price: number;
    pricePeriod: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
    currency: 'RUB';
    latitude?: number;
    longitude?: number;
    address: string;
    size?: number;
    photosJson?: string[];
    amenities?: any;
    availability?: Array<{
        start: Date;
        end: Date;
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
        console.log('📤 Sending to server:', listingData);
        const result = await this.request<ListingResponse>('/listings', {
            method: 'POST',
            body: JSON.stringify(listingData),
        });
        console.log('📥 Received from server:', result);
        return result;
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
            return data.listings || [];

        } catch (error) {
            const response = await this.request<{ listings: ListingResponse[] }>('/listings');
            return response.listings || [];
        }
    }

    async getMyListings(): Promise<ListingResponse[]> {
        try {
            const profileResponse = await authApiService.getProfile();
            if (profileResponse.success && profileResponse.data) {
                const userId = profileResponse.data.id;
                const response = await this.request<{ listings: ListingResponse[] }>(`/listings/user/${userId}`);
                return response.listings || [];
            }
            return [];
        } catch (error) {
            console.error('Error getting my listings:', error);
            return [];
        }
    }

    async getListingById(id: number): Promise<ListingResponse> {
        return this.request<ListingResponse>(`/listings/${id}`);
    }

    async updateListing(id: number, listingData: Partial<CreateListingRequest>): Promise<ListingResponse> {
        return this.request<ListingResponse>(`/listings/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(listingData),
        });
    }

    async deleteListing(id: number): Promise<void> {
        await this.request(`/listings/${id}`, {
            method: 'DELETE',
        });
    }
}

export const listingApiService = new ListingApiService();