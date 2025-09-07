// src/lib/subscriptionService.ts - UPDATED: New pricing structure
import { supabase } from './supabase';
import { loadStripe } from '@stripe/stripe-js';

const pendingCheckoutRequests = new Map<string, Promise<string>>();

export const subscriptionService = {
  /**
   * Get available plans configuration - UPDATED PRICING
   */
  getPlansConfig() {
    return {
      monthly: {
        name: 'Monthly Plan',
        price: 19.95,
        priceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY,
        interval: 'month',
        features: [
          '24/7 AI coaching with Stan',
          'LinkedIn optimization strategies',
          'Content creation guidance',
          'Growth analytics dashboard',
          'Multi-platform support',
          'Unlimited AI conversations'
        ]
      },
      yearly: {
        name: 'Yearly Plan',
        price: 143.95,
        priceId: import.meta.env.VITE_STRIPE_PRICE_YEARLY,
        interval: 'year',
        savings: 'Save $95.45 annually',
        features: [
          '24/7 AI coaching with Stan',
          'LinkedIn optimization strategies',
          'Content creation guidance', 
          'Growth analytics dashboard',
          'Multi-platform support',
          'Unlimited AI conversations'
        ]
      }
    };
  },

  /**
   * Create checkout session - updated to handle paymentRequired field
   */
  async createCheckoutSession(
    planType: 'monthly' | 'yearly',
    userId: string,
    userEmail: string
  ): Promise<string> {
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
      pendingCheckoutRequests.delete(requestKey);
    }
  },

  async _createCheckoutSessionInternal(
    planType: 'monthly' | 'yearly',
    userId: string,
    userEmail: string
  ): Promise<string> {
    try {
      console.log('🛒 Creating checkout session:', { planType, userId, userEmail });

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          planType,
          userId,
          userEmail
        }
      });

      if (error) {
        console.error('❌ Checkout session error:', error);
        throw new Error(`Failed to create checkout session: ${error.message}`);
      }

      if (!data?.url) {
        console.error('❌ No checkout URL returned:', data);
        throw new Error('Invalid response from checkout service');
      }

      console.log('✅ Checkout session created:', {
        sessionId: data.sessionId,
        hasUrl: !!data.url,
        paymentRequired: data.paymentRequired
      });

      return data.url;
    } catch (error) {
      console.error('❌ Subscription service error:', error);
      throw error;
    }
  },

  /**
   * Get current user subscription
   */
  async getCurrentSubscription(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCurrentSubscription:', error);
      return null;
    }
  },

  /**
   * Create customer portal session
   */
  async createPortalSession(userId: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { userId }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data.url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  },

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.getCurrentSubscription(userId);
    return !!subscription;
  },

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(userId: string): Promise<'active' | 'inactive' | 'expired'> {
    const subscription = await this.getCurrentSubscription(userId);
    
    if (!subscription) {
      return 'inactive';
    }

    // Check if subscription is expired
    if (subscription.current_period_end && new Date(subscription.current_period_end) < new Date()) {
      return 'expired';
    }

    return subscription.status === 'active' ? 'active' : 'inactive';
  }
};