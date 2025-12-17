import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra;

export const API_BASE_URL = extra?.apiUrl;
export const ENVIRONMENT = extra?.environment || 'development';
export const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;
export const TELEGRAM_DEEP_LINK_SCHEME = process.env.TELEGRAM_DEEP_LINK_SCHEME || 'your-app://';

console.log('🔗 Expo Environment:', {
    API_BASE_URL,
    ENVIRONMENT
});