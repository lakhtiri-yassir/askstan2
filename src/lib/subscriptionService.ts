// src/lib/subscriptionService.ts - UPDATED: Added conditional redirect based on paymentRequired
import { supabase } from './supabase';
import { loadStripe } from '@stripe/stripe-js';

const pendingCheckoutRequests = new Map<string, Promise<string>>();

export const subscriptionService = {
  /**
   * Get available plans configuration
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

  /**
   * Internal checkout session creation - UPDATED: Added conditional redirect logic
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

      // UPDATED: Check if payment is required
      if (data.paymentRequired === false) {
        console.log('🆓 Free subscription detected, redirecting directly to success page');
        window.location.href = data.url;
        return data.url;
      } else {
        console.log('💳 Payment required, redirecting to Stripe Checkout');
        
        if (!data.sessionId) {
          throw new Error('No session ID returned for paid checkout');
        }
        
        // Load Stripe and redirect to checkout
        const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
        if (!stripe) {
          throw new Error('Failed to load Stripe');
        }
        
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: data.sessionId
        });
        
        if (stripeError) {
          throw new Error(stripeError.message || 'Stripe checkout failed');
        }
        
        // This return won't be reached due to redirect, but needed for TypeScript
        return data.url;
      }
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
        .maybeSingle();

      if (error) {
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
    console.log('Handling checkout success for session:', sessionId);
    // Implementation for checkout success handling
    // This method was incomplete in the original, keeping as-is
    return { sessionId };
  }
};