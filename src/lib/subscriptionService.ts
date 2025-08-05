import { supabase } from './supabase';
import { loadStripe } from '@stripe/stripe-js';
import { Subscription } from '../types/supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

export type SubscriptionStatus = 'active' | 'inactive' | 'expired' | 'past_due' | 'cancelled';

export interface SubscriptionCheckResult {
  hasActiveSubscription: boolean;
  subscription: Subscription | null;
  status: SubscriptionStatus;
}

export const subscriptionService = {
  /**
   * Check user's current subscription status
   */
  async checkUserSubscription(userId: string): Promise<SubscriptionCheckResult> {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking subscription:', error);
        throw error;
      }

      const hasActiveSubscription = subscription?.status === 'active' && 
        (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date());

      return {
        hasActiveSubscription,
        subscription,
        status: subscription?.status as SubscriptionStatus || 'inactive'
      };
    } catch (error) {
      console.error('Subscription check error:', error);
      return {
        hasActiveSubscription: false,
        subscription: null,
        status: 'inactive'
      };
    }
  },

  /**
   * Create Stripe checkout session
   */
  async createStripeCheckout(
  userId: string, 
  planType: 'monthly' | 'yearly',
  couponCode?: string
): Promise<{ sessionId?: string; paymentRequired: boolean; couponApplied: boolean; redirectUrl?: string }> {
  try {
    console.log('Creating checkout with coupon:', { userId, planType, couponCode });
    
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { 
        planType,
        userId,
        couponCode: couponCode || null,
        successUrl: `${window.location.origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}&plan=${planType}&coupon=${couponCode || ''}`,
        cancelUrl: `${window.location.origin}/plans`
      }
    });

    if (error) {
      console.error('Checkout session error:', error);
      throw new Error(error.message || 'Failed to create checkout session');
    }

    // Handle 100% off coupon case (no payment required)
    if (data?.paymentRequired === false) {
      return {
        paymentRequired: false,
        couponApplied: true,
        redirectUrl: data.redirectUrl
      };
    }

    if (!data?.sessionId) {
      throw new Error('No session ID returned from checkout creation');
    }

    return {
      sessionId: data.sessionId,
      paymentRequired: data.paymentRequired !== false,
      couponApplied: data.couponApplied || false,
      redirectUrl: data.redirectUrl
    };
  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw error;
  }
},

/**
 * Validate coupon code before checkout
 */
async validateCoupon(couponCode: string): Promise<{ valid: boolean; discount?: string; error?: string }> {
  try {
    // This will validate the coupon through the checkout creation
    // We'll create a test checkout to validate, then use the real one
    const { data, error } = await supabase.functions.invoke('validate-coupon', {
      body: { couponCode }
    });

    if (error) {
      return { valid: false, error: error.message };
    }

    return { 
      valid: true, 
      discount: data.discount 
    };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid coupon code' 
    };
  }
},

  /**
   * Redirect to Stripe checkout
   */
  async redirectToCheckout(sessionId: string): Promise<void> {
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Checkout redirect error:', error);
      throw error;
    }
  },

  /**
   * Handle successful checkout completion
   */
  async handleCheckoutSuccess(sessionId: string): Promise<Subscription | null> {
    try {
      console.log('🎉 Handling checkout success for session:', sessionId);
      
      // First, try to get session details from Stripe
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke('get-checkout-session', {
        body: { sessionId }
      });
      
      if (sessionError) {
        console.error('Failed to get session details:', sessionError);
      } else {
        console.log('Session details:', sessionData);
      }

      // Refresh subscription data from database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Try multiple times to get subscription data (webhook might be slow)
      let attempts = 0;
      let subscription = null;
      
      while (attempts < 8 && !subscription) {
        console.log(`🔄 Attempt ${attempts + 1} to fetch subscription...`);
        
        const result = await this.checkUserSubscription(user.id);
        subscription = result.subscription;
        
        if (!subscription) {
          console.log('⏳ Subscription not found, waiting 3 seconds...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        attempts++;
      }
      
      if (!subscription) {
        console.error('❌ Subscription not found after 8 attempts, trying manual creation...');
        // Try to manually create subscription record if webhook failed
        await this.manuallyCreateSubscription(sessionId, user.id);
        
        // Wait a bit and try one more time
        await new Promise(resolve => setTimeout(resolve, 2000));
        const finalResult = await this.checkUserSubscription(user.id);
        subscription = finalResult.subscription;
        
        if (!subscription) {
          console.error('❌ Manual subscription creation also failed');
          throw new Error('Failed to create subscription record. Please contact support.');
        }
      }
      
      console.log('✅ Final subscription result:', subscription);
      return subscription;
    } catch (error) {
      console.error('Checkout success handling error:', error);
      throw error;
    }
  },

  /**
   * Manually create subscription if webhook failed
   */
  async manuallyCreateSubscription(sessionId: string, userId: string): Promise<void> {
    try {
      console.log('🔧 Manually creating subscription for session:', sessionId);
      
      // Call edge function to retrieve session details and create subscription
      const { data, error } = await supabase.functions.invoke('manual-subscription-creation', {
        body: { sessionId, userId }
      });
      
      if (error) {
        console.error('Manual subscription creation error:', error);
        throw error;
      }
      
      console.log('✅ Manual subscription created:', data);
    } catch (error) {
      console.error('Manual subscription creation failed:', error);
      throw error;
    }
  },

  /**
   * Create customer portal session for subscription management
   */
  async createCustomerPortalSession(): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { 
          returnUrl: `${window.location.origin}/settings`
        }
      });

      if (error) {
        console.error('Portal session error:', error);
        throw new Error(error.message || 'Failed to create portal session');
      }

      if (!data?.url) {
        throw new Error('No portal URL returned');
      }

      return data.url;
    } catch (error) {
      console.error('Customer portal error:', error);
      throw error;
    }
  },

  /**
   * Get subscription plans configuration
   */
  getPlansConfig() {
    return {
      monthly: {
        id: 'monthly',
        name: 'Monthly Plan',
        price: '$4.99',
        interval: 'month',
        priceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY,
        features: [
          'AI-powered social media coaching',
          'Multi-platform support',
          'Growth analytics dashboard',
          '24/7 AI chat support'
        ]
      },
      yearly: {
        id: 'yearly',
        name: 'Yearly Plan',
        price: '$49.99',
        interval: 'year',
        priceId: import.meta.env.VITE_STRIPE_PRICE_YEARLY,
        savings: '17% savings',
        popular: true,
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
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }
};