'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import * as api from '@/lib/api';

// PayPal configuration - hardcoded for reliability (same as backend)
const PAYPAL_CLIENT_ID = 'AQkBJ3wyz9rRNdY36CFMsaQpchZTrqgaRPQgXA1zPtfnUVhVA4BeV75KIG7ikzGWBgYfRn8NULl2Ivqj';
const PAYPAL_PLAN_IDS = {
  basic: 'P-9HN26005PT8329537NEZC4AA',
  pro: 'P-65030679KA417305BNEZC4AY',
  premium: 'P-9LS85721FN3193001NEZC4BA',
};

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$4.99',
    priceValue: 4.99,
    limit: 25,
    planId: PAYPAL_PLAN_IDS.basic,
    features: [
      '25 conversation analyses per month',
      'AI-powered manipulation detection',
      'Hidden intent analysis',
      'Strategic reply suggestions',
      'Basic support',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99',
    priceValue: 9.99,
    limit: 100,
    planId: PAYPAL_PLAN_IDS.pro,
    features: [
      '100 conversation analyses per month',
      'Everything in Basic',
      'Priority support',
      'Analysis history',
      'Advanced insights',
    ],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$19.99',
    priceValue: 19.99,
    limit: -1,
    planId: PAYPAL_PLAN_IDS.premium,
    features: [
      'Unlimited analyses',
      'Everything in Pro',
      '24/7 priority support',
      'Export to PDF',
      'Advanced analytics dashboard',
      'Early access to new features',
    ],
    popular: false,
  },
];

export default function Subscription() {
  const { user, refreshSubscriptionStatus } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Fetch current subscription status
    const fetchStatus = async () => {
      try {
        const status = await api.getSubscriptionStatus();
        setCurrentSubscription(status);
        console.log('Current subscription status:', status);
      } catch (err) {
        console.error('Failed to fetch subscription:', err);
      }
    };

    fetchStatus();
  }, [user, router]);

  const handleCreateSubscription = (data: any, actions: any, plan: typeof plans[0]) => {
    console.log('🔵 Creating PayPal subscription for plan:', plan.id, 'with PayPal plan ID:', plan.planId);
    setDebugInfo(`Creating subscription: ${plan.id} (${plan.planId})`);

    if (!plan.planId) {
      setError('PayPal plan ID is not configured. Please contact support.');
      return Promise.reject(new Error('Plan ID not configured'));
    }

    return actions.subscription.create({
      plan_id: plan.planId,
    });
  };

  const handleApprove = async (data: any, plan: typeof plans[0]) => {
    console.log('✅ PayPal subscription approved:', data);
    setDebugInfo(`PayPal approved: ${data.subscriptionID}`);
    setLoading(true);
    setError('');

    try {
      console.log('📤 Calling backend to create subscription...', {
        subscriptionId: data.subscriptionID,
        tier: plan.id,
      });

      // Create subscription in backend
      const result = await api.createSubscription(data.subscriptionID, plan.id);
      console.log('📥 Backend response:', result);

      if (!result.success) {
        throw new Error(result.message || result.error || 'Subscription creation failed');
      }

      console.log('✅ Subscription created successfully!');

      // Refresh subscription status in context
      console.log('🔄 Refreshing subscription status...');
      await refreshSubscriptionStatus();

      setSuccess(true);
      setDebugInfo('Subscription activated successfully!');

      // Redirect to app after success
      console.log('➡️ Redirecting to /app in 2 seconds...');
      setTimeout(() => {
        router.push('/app');
      }, 2000);
    } catch (err: any) {
      console.error('❌ Subscription activation error:', err);
      let errorMessage = err.message || 'Failed to activate subscription';

      // Handle token-specific errors
      if (errorMessage.includes('Invalid or expired token') || errorMessage.includes('token')) {
        errorMessage = 'Your session has expired. Please log in again.';
        // Redirect to login after showing error
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }

      setError(errorMessage);
      setDebugInfo(`Error: ${errorMessage}`);
      setLoading(false); // IMPORTANT: Reset loading state on error
      setSelectedPlan(null); // Reset selected plan so user can try again
    }
  };

  const handlePayPalError = (err: any) => {
    console.error('❌ PayPal error:', err);
    setError('PayPal payment failed. Please try again.');
    setDebugInfo(`PayPal error: ${JSON.stringify(err)}`);
    setLoading(false);
    setSelectedPlan(null); // Reset so user can try again
  };

  const handleCancel = () => {
    console.log('⚠️ PayPal subscription cancelled by user');
    setDebugInfo('Payment cancelled by user');
    setLoading(false);
    setSelectedPlan(null);
  };

  if (!user) {
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-3xl p-8 text-center max-w-md"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Subscription Activated!
          </h2>
          <p className="text-muted-foreground mb-6">
            You now have full access to SubText. Redirecting to the app...
          </p>
          <div className="animate-pulse text-accent font-bold">Loading...</div>
        </motion.div>
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CLIENT_ID,
        vault: true,
        intent: 'subscription',
      }}
    >
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
            <div className="flex items-center space-x-2">
              <span className="text-2xl">😈</span>
              <h1 className="text-lg font-bold text-white">SubText</h1>
            </div>
            <div className="w-16"></div>
          </div>
        </header>

        <div className="container-mobile py-8">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-3">
              Choose Your Plan
            </h1>
            <p className="text-muted-foreground">
              Unlock the power to decode hidden intentions
            </p>
          </div>

          {/* Current Subscription Status */}
          {currentSubscription?.hasSubscription && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-accent/10 border border-accent/30 rounded-2xl p-4 mb-6"
            >
              <p className="text-accent font-bold text-sm">
                ✓ Active Subscription: {currentSubscription.subscription?.tier?.toUpperCase()}
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                {currentSubscription.usage?.remaining === -1
                  ? 'Unlimited'
                  : currentSubscription.usage?.remaining} analyses remaining this month
              </p>
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-error/10 border border-error rounded-2xl p-4 mb-6"
            >
              <p className="text-error text-sm font-bold">Error:</p>
              <p className="text-error text-sm">{error}</p>
              <button
                onClick={() => {
                  setError('');
                  setSelectedPlan(null);
                }}
                className="mt-3 text-accent text-sm hover:underline"
              >
                Try again
              </button>
            </motion.div>
          )}

          {/* Debug Info (development only) */}
          {process.env.NODE_ENV === 'development' && debugInfo && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-6">
              <p className="text-blue-400 text-xs font-mono">{debugInfo}</p>
            </div>
          )}

          {/* Plans */}
          <div className="space-y-4 mb-8">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: plans.indexOf(plan) * 0.1 }}
                className={`bg-card rounded-3xl p-6 border-2 transition-all ${
                  plan.popular
                    ? 'border-accent shadow-glow'
                    : 'border-border'
                } ${
                  selectedPlan === plan.id ? 'ring-2 ring-accent' : ''
                }`}
              >
                {plan.popular && (
                  <div className="mb-4">
                    <span className="bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">
                      {plan.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {plan.limit === -1 ? 'Unlimited' : plan.limit} analyses/month
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-accent">{plan.price}</p>
                    <p className="text-muted-foreground text-xs">/month</p>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <span className="text-accent mt-0.5">✓</span>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Subscribe Button / PayPal */}
                {selectedPlan === plan.id ? (
                  <div className="mt-4">
                    {loading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin text-4xl mb-2">😈</div>
                        <p className="text-accent font-bold">Processing subscription...</p>
                        <p className="text-muted-foreground text-xs mt-2">Please wait, do not close this page</p>
                      </div>
                    ) : (
                      <>
                        <PayPalButtons
                          createSubscription={(data, actions) => handleCreateSubscription(data, actions, plan)}
                          onApprove={(data) => handleApprove(data, plan)}
                          onError={handlePayPalError}
                          onCancel={handleCancel}
                          style={{
                            layout: 'vertical',
                            color: 'gold',
                            shape: 'rect',
                            label: 'subscribe',
                          }}
                        />
                        <button
                          onClick={() => setSelectedPlan(null)}
                          className="w-full mt-3 text-muted-foreground text-sm hover:text-accent transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedPlan(plan.id);
                      setError('');
                      setDebugInfo(`Selected plan: ${plan.id}`);
                    }}
                    disabled={loading || currentSubscription?.subscription?.tier === plan.id}
                    className={`w-full py-4 rounded-2xl font-bold transition-all ${
                      plan.popular
                        ? 'bg-accent hover:bg-accent-dark text-white shadow-glow'
                        : 'bg-background hover:bg-border text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {currentSubscription?.subscription?.tier === plan.id
                      ? 'Current Plan'
                      : 'Select Plan'}
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          {/* Footer Info */}
          <div className="bg-card rounded-2xl p-4 text-center">
            <p className="text-muted-foreground text-xs">
              Secure payments via PayPal. Cancel anytime.
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Subscription will auto-renew monthly.
            </p>
          </div>

          {/* Skip Option (for testing in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/app')}
                className="text-muted-foreground text-sm hover:text-accent transition-colors"
              >
                [DEV] Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
