declare module 'expo-constants' {
    export interface ExpoConfig {
        extra?: {
            apiUrl?: string;
            environment?: string;
        };
    }

    export const expoConfig: ExpoConfig | undefined;
    export default Constants;
}