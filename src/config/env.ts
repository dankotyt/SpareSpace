import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra;

export const API_BASE_URL = extra?.apiUrl;
export const ENVIRONMENT = extra?.environment || 'development';

console.log('🔗 Expo Environment:', {
    API_BASE_URL,
    ENVIRONMENT
});