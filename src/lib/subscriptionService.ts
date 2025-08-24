// src/lib/subscriptionService.ts - FRONTEND COUPON VALIDATION
import { supabase } from './supabase';

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
   * CRITICAL FIX: Validate coupon on frontend first
   */
  async validateCoupon(couponCode: string): Promise<{ valid: boolean; discount?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { couponCode: couponCode.trim().toUpperCase() }
      });

      if (error) {
        return { valid: false, error: error.message };
      }

      return { 
        valid: data.valid, 
        discount: data.discount,
        error: data.error 
      };
    } catch (err) {
      return { valid: false, error: 'Failed to validate coupon' };
    }
  },

  /**
   * CRITICAL FIX: Create checkout with upfront coupon validation
   */
  async createCheckoutSession(
    planType: 'monthly' | 'yearly',
    userId: string,
    userEmail: string,
    couponCode?: string
  ): Promise<string> {
    const requestKey = `checkout-${userId}-${planType}`;
    
    if (pendingCheckoutRequests.has(requestKey)) {
      console.log("🔄 Reusing existing checkout request");
      return pendingCheckoutRequests.get(requestKey)!;
    }

    const checkoutPromise = this._createCheckoutSessionInternal(planType, userId, userEmail, couponCode);
    pendingCheckoutRequests.set(requestKey, checkoutPromise);

    try {
      const result = await checkoutPromise;
      return result;
    } finally {
      pendingCheckoutRequests.delete(requestKey);
    }
  },

  /**
   * Internal checkout session creation with coupon pre-validation
   */
  async _createCheckoutSessionInternal(
    planType: 'monthly' | 'yearly',
    userId: string,
    userEmail: string,
    couponCode?: string
  ): Promise<string> {
    try {
      console.log('Creating checkout session:', { planType, userId, userEmail, couponCode });

      const plans = this.getPlansConfig();
      const selectedPlan = plans[planType];

      if (!selectedPlan.priceId) {
        throw new Error(`Price ID not configured for ${planType} plan`);
      }

      // CRITICAL FIX: Validate coupon on frontend first
      let validatedCoupon = null;
      if (couponCode) {
        const validation = await this.validateCoupon(couponCode);
        if (!validation.valid) {
          throw new Error(validation.error || 'Invalid coupon code');
        }
        validatedCoupon = {
          code: couponCode.trim().toUpperCase(),
          discount: validation.discount,
          is100Percent: validation.discount === '100%'
        };
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          planType,
          userId,
          userEmail,
          couponCode: validatedCoupon?.code,
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
    try {
      console.log('🔄 Processing checkout success for session:', sessionId);

      // Handle free subscriptions (100% coupon case)
      if (sessionId.startsWith('free_')) {
        console.log('✅ Free subscription detected - returning immediately');
        return { status: 'active', plan_type: 'free_coupon' };
      }

      let attempts = 0;
      const maxAttempts = 10;
      
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
          
          await new Promise(resolve => setTimeout(resolve, 1500));
          attempts++;
        } catch (error) {
          console.warn(`Attempt ${attempts + 1} failed:`, error);
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      console.warn('⚠️ Subscription not found after polling');
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