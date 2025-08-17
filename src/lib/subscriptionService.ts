// src/lib/subscriptionService.ts
import { supabase } from './supabase';

// CRITICAL FIX: Add request deduplication to prevent concurrent checkout requests
const pendingCheckoutRequests = new Map<string, Promise<string>>();

export const subscriptionService = {
  /**
   * Get available plans configuration
   */
  getPlansConfig() {
    return {
      monthly: {
        name: 'Monthly Plan',
        price: 4.99,
        priceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY,
        interval: 'month',
        features: [
          'AI-powered social media coaching',
          'Multi-platform support',
          'Growth analytics dashboard',
          '24/7 AI chat support'
        ]
      },
      yearly: {
        name: 'Yearly Plan',
        price: 49.99,
        priceId: import.meta.env.VITE_STRIPE_PRICE_YEARLY,
        interval: 'year',
        savings: '17% savings',
        features: [
          'All monthly features',
          'Priority AI responses',
          'Advanced analytics',
          'Custom growth strategies'
        ]
      }
    };
  },

  /**
   * CRITICAL FIX: Create checkout session with request deduplication
   */
  async createCheckoutSession(
    planType: 'monthly' | 'yearly',
    userId: string,
    userEmail: string
  ): Promise<string> {
    // CRITICAL FIX: Prevent concurrent checkout requests
    const requestKey = `checkout-${userId}-${planType}`;
    
    if (pendingCheckoutRequests.has(requestKey)) {
      console.log("🔄 Reusing existing checkout request");
      return pendingCheckoutRequests.get(requestKey)!;
    }

    const checkoutPromise = this._createCheckoutSessionInternal(planType, userId, userEmail);
    pendingCheckoutRequests.set(requestKey, checkoutPromise);

    try {
      const result = await checkoutPromise;
      return result;
    } finally {
      // Clean up completed request
      pendingCheckoutRequests.delete(requestKey);
    }
  },

  /**
   * Internal checkout session creation
   */
  async _createCheckoutSessionInternal(
    planType: 'monthly' | 'yearly',
    userId: string,
    userEmail: string
  ): Promise<string> {
    try {
      console.log('Creating checkout session:', { planType, userId, userEmail });

      const plans = this.getPlansConfig();
      const selectedPlan = plans[planType];

      if (!selectedPlan.priceId) {
        throw new Error(`Price ID not configured for ${planType} plan`);
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          planType,
          userId,
          userEmail,
          successUrl: `${window.location.origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/plans`,
        }
      });

      if (error) {
        console.error('Checkout session error:', error);
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (!data?.url) {
        throw new Error('No checkout URL returned');
      }

      console.log('✅ Checkout session created successfully');
      return data.url;
    } catch (error) {
      console.error('Subscription service error:', error);
      throw error;
    }
  },

  /**
   * Create customer portal session
   */
  async createCustomerPortalSession(): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session');

      if (error) {
        throw new Error(error.message || 'Failed to create portal session');
      }

      if (!data?.url) {
        throw new Error('No portal URL returned');
      }

      return data.url;
    } catch (error) {
      console.error('Portal session error:', error);
      throw error;
    }
  },

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Get subscription error:', error);
      return null;
    }
  },

  /**
   * Handle successful checkout with improved retry logic
   */
  async handleCheckoutSuccess(sessionId: string): Promise<any> {
    try {
      console.log('🔄 Processing checkout success for session:', sessionId);

      // CRITICAL FIX: Reduced polling attempts and better error handling
      let attempts = 0;
      const maxAttempts = 10; // Reduced from 15
      
      while (attempts < maxAttempts) {
        try {
          const { data: user } = await supabase.auth.getUser();
          if (!user.user) {
            throw new Error('User not authenticated');
          }

          const subscription = await this.getUserSubscription(user.user.id);
          
          if (subscription) {
            console.log('✅ Subscription found:', subscription);
            return subscription;
          }

          console.log(`⏳ Attempt ${attempts + 1}/${maxAttempts}: Subscription not yet created, retrying...`);
          
          // CRITICAL FIX: Shorter delay for better UX
          await new Promise(resolve => setTimeout(resolve, 1500)); // Reduced from 2000ms
          attempts++;
        } catch (error) {
          console.warn(`Attempt ${attempts + 1} failed:`, error);
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      console.warn('⚠️ Subscription not found after polling, manual creation may be needed');
      throw new Error('Subscription verification timed out. Please contact support if your payment was processed.');
    } catch (error) {
      console.error('Checkout success handling error:', error);
      throw error;
    }
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId }
      });

      if (error) {
        throw new Error(error.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  },

  /**
   * Check subscription status
   */
  async checkSubscriptionStatus(userId: string) {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      return {
        hasActiveSubscription: !!subscription,
        subscription: subscription,
        status: subscription?.status || 'inactive'
      };
    } catch (error) {
      console.error('Subscription status check error:', error);
      return {
        hasActiveSubscription: false,
        subscription: null,
        status: 'inactive'
      };
    }
  }
};