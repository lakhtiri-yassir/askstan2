import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

export const stripeService = {
  async createCheckoutSession(planType: 'monthly' | 'yearly') {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { planType }
      });
      
      if (error) throw error;
      
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');
      
      return stripe.redirectToCheckout({ sessionId: data.sessionId });
    } catch (error) {
      console.error('Stripe checkout error:', error);
      throw error;
    }
  },
  
  async createCustomerPortalSession() {
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session');
      
      if (error) throw error;
      
      window.location.href = data.url;
    } catch (error) {
      console.error('Customer portal error:', error);
      throw error;
    }
  },
  
  async cancelSubscription() {
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription');
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }
};