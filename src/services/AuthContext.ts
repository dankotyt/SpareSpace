import React from 'react';
import { AuthState, AuthActions } from '@/types/auth';

export const AuthContext = React.createContext<(AuthState & AuthActions) | undefined>(undefined);