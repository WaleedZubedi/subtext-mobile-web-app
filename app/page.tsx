'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = () => {
      // Wait for client-side to be ready
      if (typeof window === 'undefined') return;

      // Small delay to ensure localStorage is accessible
      setTimeout(() => {
        const hasSeenOnboarding = api.hasSeenOnboarding();

        if (!hasSeenOnboarding) {
          router.push('/onboarding');
        } else if (!loading) {
          if (!user) {
            router.push('/login');
          } else {
            router.push('/app');
          }
        }
        setChecking(false);
      }, 100);
    };

    checkOnboarding();
  }, [user, loading, router]);

  // Show loading screen while checking
  if (checking || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="text-accent text-4xl font-bold mb-2">SubText</div>
          <div className="mt-2 text-muted-foreground text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  return null;
}
