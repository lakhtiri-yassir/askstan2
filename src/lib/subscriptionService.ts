// src/lib/subscriptionService.ts - Updated for New Pricing
import { supabase } from './supabase';

export interface SubscriptionPlan {
  id: 'monthly' | 'yearly';
  name: string;
  price: string;
  originalPrice?: string;
  interval: string;
  priceId: string;
  savings?: string;
  popular?: boolean;
  features: string[];
}

export const subscriptionService = {
  /**
   * Get subscription plans configuration with updated pricing
   */
  getPlansConfig(): { monthly: SubscriptionPlan; yearly: SubscriptionPlan } {
    return {
      monthly: {
        id: 'monthly',
        name: 'Monthly Plan',
        price: '$19.95',
        interval: 'month',
        priceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY,
        popular: false,
        features: [
          'AI-powered social media coaching',
          'Write viral hooks and captions',
          'Complete LinkedIn post creation',
          'Newsletter content generation',
          'Profile optimization strategies',
          'Content repurposing for all platforms',
          'Monetization guidance',
          '24/7 AI chat support',
          'Content analysis and optimization tips'
        ]
      },
      yearly: {
        id: 'yearly',
        name: 'Annual Plan',
        price: '$143.95',
        originalPrice: '$239.40',
        interval: 'year',
        priceId: import.meta.env.VITE_STRIPE_PRICE_YEARLY,
        savings: '40% OFF',
        popular: true,
        features: [
          'Everything in Monthly Plan',
          'Priority AI responses',
          'Advanced analytics dashboard',
          'Custom growth strategies',
          'Exclusive monetization templates',
          'Advanced content optimization',
          'Priority customer support',
          'Early access to new features',
          'Save $95.45 per year'
        ]
      }
    };
  },

  /**
   * Create Stripe checkout session with trial period
   */
  async createCheckoutSession(
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
          priceId: selectedPlan.priceId,
          userId,
          userEmail,
          planType,
          successUrl: `${window.location.origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/plans`,
          // 3-day trial configuration
          trialPeriodDays: 3,
          allowPromotionCodes: true
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
   * Handle successful checkout
   */
  async handleCheckoutSuccess(sessionId: string): Promise<any> {
    try {
      console.log('🔄 Processing checkout success for session:', sessionId);

      // Poll for subscription creation with improved retry logic
      let attempts = 0;
      const maxAttempts = 15; // Try for 30 seconds
      
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
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
        } catch (error) {
          console.warn(`Attempt ${attempts + 1} failed:`, error);
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 2000));
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
   * Create customer portal session for subscription management
   */
  async createCustomerPortalSession(): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {
          returnUrl: `${window.location.origin}/settings`,
        },
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
   * Cancel subscription
   */
  async cancelSubscription(): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const subscription = await this.getUserSubscription(user.user.id);
      if (!subscription) throw new Error('No active subscription found');

      // Update subscription to cancel at period end
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      console.log('✅ Subscription set to cancel at period end');
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  },

  /**
   * Get pricing display info
   */
  getPricingDisplay() {
    return {
      monthly: {
        price: 19.95,
        display: '$19.95/month',
        yearlyEquivalent: 239.40,
        trial: '3-day free trial'
      },
      yearly: {
        price: 143.95,
        display: '$143.95/year',
        monthlyEquivalent: 11.99,
        savings: 95.45,
        savingsPercentage: 40,
        trial: '3-day free trial + Save 40%'
      }
    };
  },

  /**
   * Calculate savings for yearly plan
   */
  calculateYearlySavings() {
    const pricing = this.getPricingDisplay();
    return {
      monthlyCost: pricing.monthly.yearlyEquivalent,
      yearlyCost: pricing.yearly.price,
      totalSavings: pricing.yearly.savings,
      percentageSavings: pricing.yearly.savingsPercentage
    };
  }
};