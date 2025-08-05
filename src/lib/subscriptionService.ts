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
  async createStripeCheckout(userId: string, planType: 'monthly' | 'yearly'): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          planType,
          userId,
          successUrl: `${window.location.origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}&plan=${planType}`,
          cancelUrl: `${window.location.origin}/plans`
        }
      });

      if (error) {
        console.error('Checkout session error:', error);
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (!data?.sessionId) {
        throw new Error('No session ID returned from checkout creation');
      }

      return data.sessionId;
    } catch (error) {
      console.error('Stripe checkout error:', error);
      throw error;
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
      // Wait a moment for webhook to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Refresh subscription data from database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const result = await this.checkUserSubscription(user.id);
      return result.subscription;
    } catch (error) {
      console.error('Checkout success handling error:', error);
      return null;
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
        popular: false,
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
        popular: true,
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