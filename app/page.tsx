'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Always check onboarding first on client-side
    if (typeof window !== 'undefined') {
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');

      if (hasSeenOnboarding !== 'true') {
        // Force redirect to onboarding for first-time users
        router.replace('/onboarding');
      } else {
        // Check if user is logged in
        const userToken = localStorage.getItem('userToken');

        if (userToken) {
          router.replace('/app');
        } else {
          router.replace('/login');
        }
      }
    }
  }, [router]);

  // Show loading screen while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-white">Sub</span>
          <span className="text-accent">Text</span>
        </h1>
        <div className="mt-2 text-muted-foreground text-sm">Loading...</div>
      </div>
    </div>
  );
}
