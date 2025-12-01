import { createContext } from 'react';
import { useAuthLogic } from '@hooks/auth/useAuth';

export const AuthContext = createContext<ReturnType<typeof useAuthLogic> | undefined>(undefined);