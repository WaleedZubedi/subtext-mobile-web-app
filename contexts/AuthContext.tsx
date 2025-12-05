'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api';

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasSubscription: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSubscriptionStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const router = useRouter();

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = api.getToken();
        const userData = api.getUserData();
        const subscriptionStatus = api.getLocalSubscriptionStatus();

        if (token && userData) {
          setUser(userData);
          setHasSubscription(subscriptionStatus);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      setUser(response.user);

      // Check subscription status after login
      await refreshSubscriptionStatus();

      router.push('/app');
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    try {
      const response = await api.signup(email, password, fullName);
      setUser(response.user);

      // New users don't have subscription
      setHasSubscription(false);

      router.push('/subscription');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
      setHasSubscription(false);
      router.push('/login');
    } catch (error) {
      // Logout locally even if API fails
      setUser(null);
      setHasSubscription(false);
      router.push('/login');
    }
  };

  const refreshSubscriptionStatus = async () => {
    try {
      const status = await api.getSubscriptionStatus();
      const hasSub = status.hasSubscription || false;
      setHasSubscription(hasSub);
      api.saveSubscriptionStatus(hasSub);
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasSubscription,
        login,
        signup,
        logout,
        refreshSubscriptionStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
