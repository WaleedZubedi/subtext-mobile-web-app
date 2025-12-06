'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as api from '@/lib/api';

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface SubscriptionDetails {
  tier: string;
  status: string;
  monthlyLimit: number;
  expiresAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasSubscription: boolean;
  subscriptionDetails: SubscriptionDetails | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSubscriptionStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Pages that don't require authentication
const publicPages = ['/', '/login', '/signup', '/onboarding'];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = api.getToken();
        const userData = api.getUserData();
        const localSubscriptionStatus = api.getLocalSubscriptionStatus();

        console.log('Auth check:', { hasToken: !!token, hasUserData: !!userData, localSubscriptionStatus });

        if (token && userData) {
          setUser(userData);
          setHasSubscription(localSubscriptionStatus);

          // Refresh subscription status from server (non-blocking)
          refreshSubscriptionStatus().catch(console.error);
        } else if (!publicPages.includes(pathname)) {
          // Not logged in and trying to access protected page
          console.log('Not authenticated, redirecting to login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname]);

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Logging in...');
      const response = await api.login(email, password);
      setUser(response.user);

      // Check subscription status after login
      await refreshSubscriptionStatus();

      console.log('AuthContext: Login successful, redirecting to /app');
      router.push('/app');
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    try {
      console.log('AuthContext: Signing up...');
      const response = await api.signup(email, password, fullName);
      setUser(response.user);

      // New users don't have subscription
      setHasSubscription(false);
      setSubscriptionDetails(null);

      console.log('AuthContext: Signup successful, redirecting to /subscription');
      router.push('/subscription');
    } catch (error) {
      console.error('AuthContext: Signup failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('AuthContext: Logging out...');
      await api.logout();
      setUser(null);
      setHasSubscription(false);
      setSubscriptionDetails(null);
      router.push('/login');
    } catch (error) {
      // Logout locally even if API fails
      console.error('AuthContext: Logout API failed, clearing local data:', error);
      setUser(null);
      setHasSubscription(false);
      setSubscriptionDetails(null);
      router.push('/login');
    }
  };

  const refreshSubscriptionStatus = async () => {
    try {
      console.log('AuthContext: Refreshing subscription status...');
      const status = await api.getSubscriptionStatus();

      const hasSub = status.hasSubscription || false;
      setHasSubscription(hasSub);

      if (status.subscription) {
        setSubscriptionDetails(status.subscription);
      }

      api.saveSubscriptionStatus(hasSub);
      console.log('AuthContext: Subscription status updated:', { hasSubscription: hasSub, details: status.subscription });
    } catch (error) {
      console.error('AuthContext: Failed to fetch subscription status:', error);
      // Don't update local state on error - keep existing value
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasSubscription,
        subscriptionDetails,
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
