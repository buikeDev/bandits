'use client';

import type { AuthResponse, CustomerLoginInput, CustomerRegistrationInput } from '@bandit/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from './api';

type Customer = AuthResponse['customer'];
type AuthContextValue = {
  customer: Customer | null;
  loading: boolean;
  login: (input: CustomerLoginInput) => Promise<void>;
  register: (input: CustomerRegistrationInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<AuthResponse>('/auth/me')
      .then((data) => setCustomer(data.customer))
      .catch(() => setCustomer(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (input: CustomerLoginInput) => {
    const data = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST', body: JSON.stringify(input),
    });
    setCustomer(data.customer);
  }, []);

  const register = useCallback(async (input: CustomerRegistrationInput) => {
    const data = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST', body: JSON.stringify(input),
    });
    setCustomer(data.customer);
  }, []);

  const logout = useCallback(async () => {
    await apiRequest<void>('/auth/logout', { method: 'POST' });
    setCustomer(null);
  }, []);

  const value = useMemo(
    () => ({ customer, loading, login, register, logout }),
    [customer, loading, login, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
