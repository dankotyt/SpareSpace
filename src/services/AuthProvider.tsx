import React from 'react';
import { AuthContext } from '@/services/AuthContext';
import { useAuthLogic } from '@hooks/auth/useAuth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const auth = useAuthLogic();

    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    );
};