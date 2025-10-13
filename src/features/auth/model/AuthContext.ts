import React from 'react';
import { AuthState, AuthActions } from './types';

export const AuthContext = React.createContext<(AuthState & AuthActions) | undefined>(undefined);