import {useCallback, useState} from 'react';
import {tokenService} from '@services/tokenService';
import {authApiService} from "@services/api/authApi";

export const useAuthCheck = () => {
    const [isChecking, setIsChecking] = useState(false);

    const checkAuth = useCallback(async (): Promise<boolean> => {
        setIsChecking(true);
        try {
            const token = await tokenService.getToken();

            if (!token || token.trim() === '') {
                return false;
            }

            try {
                const profileResponse = await authApiService.getProfile();
                return profileResponse.success && profileResponse.data;
            } catch (error) {
                await tokenService.removeToken();
                return false;
            }

        } catch (error) {
            return false;
        } finally {
            setIsChecking(false);
        }
    }, []);

    return {
        checkAuth,
        isChecking,
    };
};