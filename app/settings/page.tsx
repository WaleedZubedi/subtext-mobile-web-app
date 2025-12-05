'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import * as api from '@/lib/api';

export default function Settings() {
  const { user, logout, hasSubscription } = useAuth();
  const router = useRouter();
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchSubscription = async () => {
      try {
        const status = await api.getSubscriptionStatus();
        setSubscriptionData(status);
      } catch (err) {
        console.error('Failed to fetch subscription:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user, router]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const resetOnboarding = () => {
    api.resetOnboarding();
    alert('Onboarding reset! Restart the app to see it again.');
  };

  const clearAllData = () => {
    if (confirm('Are you sure? This will log you out and clear all local data.')) {
      api.clearAllData();
      router.push('/login');
    }
  };

  if (!user) {
    return null;
  }

  // Generate gradient colors based on user's name
  const getGradientColors = (name: string) => {
    const colors = [
      ['#FF6B6B', '#FF8E53'],
      ['#4ECDC4', '#44A08D'],
      ['#A770EF', '#CF8BF3'],
      ['#FFA07A', '#FF6347'],
      ['#20BDFF', '#5433FF'],
    ];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  const [color1, color2] = getGradientColors(user.fullName || user.email);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container-mobile flex items-center justify-between py-4">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-accent transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-lg font-bold text-white">Settings</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <div className="container-mobile py-8 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl p-6 shadow-card"
        >
          <div className="flex items-center space-x-4">
            {/* Avatar with gradient */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${color1}, ${color2})`,
              }}
            >
              {(user.fullName || user.email)?.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{user.fullName || 'User'}</h2>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Subscription Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-3xl overflow-hidden shadow-card"
        >
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-bold text-white mb-4">Subscription</h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
              </div>
            ) : hasSubscription && subscriptionData?.subscription ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Plan</span>
                  <span className="text-white font-bold capitalize">
                    {subscriptionData.subscription.tier}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Status</span>
                  <span className="bg-success/20 text-success text-xs font-bold px-3 py-1 rounded-full">
                    ACTIVE
                  </span>
                </div>

                {subscriptionData.usage && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">This Month</span>
                      <span className="text-white font-medium">
                        {subscriptionData.usage.current} / {subscriptionData.usage.limit === -1 ? '∞' : subscriptionData.usage.limit}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">Remaining</span>
                      <span className="text-accent font-bold">
                        {subscriptionData.usage.limit === -1 ? 'Unlimited' : subscriptionData.usage.remaining}
                      </span>
                    </div>
                  </>
                )}

                <button
                  onClick={() => router.push('/subscription')}
                  className="w-full mt-4 bg-background hover:bg-border text-white font-medium py-3 rounded-2xl transition-colors"
                >
                  Manage Subscription
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No active subscription</p>
                <button
                  onClick={() => router.push('/subscription')}
                  className="bg-accent hover:bg-accent-dark text-white font-bold py-3 px-6 rounded-2xl shadow-glow transition-colors"
                >
                  Subscribe Now
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-3xl overflow-hidden shadow-card"
        >
          <button className="w-full p-5 text-left hover:bg-background transition-colors border-b border-border flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📊</span>
              <span className="text-white font-medium">Analysis History</span>
            </div>
            <span className="text-muted-foreground text-sm">Coming Soon</span>
          </button>

          <button className="w-full p-5 text-left hover:bg-background transition-colors border-b border-border flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🔔</span>
              <span className="text-white font-medium">Notifications</span>
            </div>
            <span className="text-muted-foreground text-sm">Coming Soon</span>
          </button>

          <button className="w-full p-5 text-left hover:bg-background transition-colors border-b border-border flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🔒</span>
              <span className="text-white font-medium">Privacy & Security</span>
            </div>
            <span className="text-muted-foreground">→</span>
          </button>

          <button className="w-full p-5 text-left hover:bg-background transition-colors border-b border-border flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xl">ℹ️</span>
              <span className="text-white font-medium">About</span>
            </div>
            <span className="text-muted-foreground">→</span>
          </button>

          <button className="w-full p-5 text-left hover:bg-background transition-colors flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xl">💬</span>
              <span className="text-white font-medium">Help & Support</span>
            </div>
            <span className="text-muted-foreground">→</span>
          </button>
        </motion.div>

        {/* Developer Mode (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-warning/10 border border-warning/30 rounded-3xl p-6"
          >
            <h3 className="text-warning font-bold mb-4">🔧 Developer Mode</h3>
            <div className="space-y-3">
              <button
                onClick={resetOnboarding}
                className="w-full bg-background hover:bg-border text-white py-3 rounded-2xl transition-colors"
              >
                Reset Onboarding
              </button>
              <button
                onClick={clearAllData}
                className="w-full bg-error/20 hover:bg-error/30 text-error py-3 rounded-2xl transition-colors"
              >
                Clear All Data
              </button>
            </div>
          </motion.div>
        )}

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {showLogoutConfirm ? (
            <div className="bg-card rounded-3xl p-6 shadow-card">
              <p className="text-white text-center mb-4">
                Are you sure you want to logout?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 bg-background hover:bg-border text-white py-3 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-error hover:bg-error/80 text-white py-3 rounded-2xl transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full bg-error/20 hover:bg-error/30 text-error font-bold py-4 rounded-3xl transition-colors"
            >
              Logout
            </button>
          )}
        </motion.div>

        {/* App Version */}
        <div className="text-center">
          <p className="text-muted-foreground text-xs">
            SubText v1.0.0 • Made with 😈
          </p>
        </div>
      </div>
    </div>
  );
}
