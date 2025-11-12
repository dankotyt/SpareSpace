// services/api/mainApi.ts
import {listingApiService} from './listingApi';

export interface SearchListingsDto {
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    pricePeriod?: string;
    currency?: string;
    limit?: number;
    offset?: number;
}

class MainApiService {
    async getListings(searchParams?: SearchListingsDto): Promise<{ listings: any[]; total: number }> {
        try {
            let filteredListings = await listingApiService.getListings();

            if (searchParams?.type) {
                filteredListings = filteredListings.filter(listing =>
                    listing.type === searchParams.type
                );
            }

            if (searchParams?.limit) {
                const offset = searchParams.offset || 0;
                filteredListings = filteredListings.slice(offset, offset + searchParams.limit);
            }

            return {
                listings: filteredListings,
                total: filteredListings.length
            };
        } catch (error) {
            console.error('Error getting listings in mainApi:', error);
            return { listings: [], total: 0 };
        }
    }

    async getListingsByType(type: string): Promise<{ listings: any[]; total: number }> {
        return this.getListings({ type, limit: 20 });
    }
}

export const mainApiService = new MainApiService();