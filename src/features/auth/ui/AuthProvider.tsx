import React from 'react';
import { AuthContext } from '../model/AuthContext';
import { useAuthLogic } from '../model/useAuth';

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const authLogic = useAuthLogic();

    return (
        <AuthContext.Provider value={authLogic}>
            {children}
        </AuthContext.Provider>
    );
};